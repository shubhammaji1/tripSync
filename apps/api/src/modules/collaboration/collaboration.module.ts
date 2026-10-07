import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Inject, Injectable, Module, NotFoundException, Param, Post, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { TripRole } from '@tripsync/types';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { chatMessages, documents } from '../../database/schema';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { TripAccessService } from '../../common/trip-access.service';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const messageSchema = z.object({ content: z.string().trim().min(1).max(2000), isAnnouncement: z.boolean().default(false) });
const documentSchema = z.object({
  title: z.string().trim().min(1).max(150), category: z.enum(['FLIGHT', 'HOTEL', 'TRANSPORT', 'PERMIT', 'PASS', 'INSURANCE', 'ACTIVITY', 'VISA', 'OTHER']),
  provider: z.string().max(150).default(''), referenceNumber: z.string().max(200).default(''),
  travelDate: z.string().max(50).optional(), notes: z.string().max(1000).optional(),
  fileUrl: z.string().max(7 * 1024 * 1024).optional(), fileName: z.string().max(200).optional(),
  isLocked: z.boolean().default(false), pin: z.string().regex(/^\d{6,12}$/).optional(),
}).refine(v => !v.isLocked || !!v.pin, { message: 'Use a PIN of 6–12 digits for locked documents' });

@Injectable()
export class CollaborationService {
  constructor(@Inject(DRIZZLE_PROVIDER) private db: DrizzleDB, private access: TripAccessService, private realtime: RealtimeGateway) {}

  private storageConfig() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new ServiceUnavailableException('Private document storage is not configured');
    return { url: `${url.replace(/\/$/, '')}/storage/v1`, key, bucket: process.env.DOCUMENTS_BUCKET || 'trip-documents' };
  }
  private async storage(path: string, init: RequestInit) {
    const config = this.storageConfig();
    const response = await fetch(`${config.url}${path}`, { ...init, signal: AbortSignal.timeout(15000), headers: {
      ...init.headers, Authorization: `Bearer ${config.key}`, apikey: config.key,
    } });
    if (!response.ok) throw new ServiceUnavailableException('Document storage request failed');
    return response;
  }
  async messages(tripId: string, userId: string) {
    await this.access.requireMember(tripId, userId);
    const rows = await this.db.query.chatMessages.findMany({ where: eq(chatMessages.tripId, tripId), orderBy: [desc(chatMessages.createdAt)], limit: 200 });
    return rows.reverse().map(row => ({ ...row, timestamp: row.createdAt.toISOString(), avatarLetter: row.senderName[0] || 'T' }));
  }
  async send(tripId: string, user: any, input: z.infer<typeof messageSchema>) {
    const { role } = await this.access.requireMember(tripId, user.id, true);
    if (input.isAnnouncement && role !== TripRole.OWNER && role !== TripRole.ADMIN) throw new ForbiddenException('Only trip managers can post announcements');
    const [row] = await this.db.insert(chatMessages).values({ ...input, tripId, senderId: user.id, senderName: user.fullName || 'Traveler', senderRole: role } as any).returning();
    const message = { ...row, timestamp: row.createdAt.toISOString(), avatarLetter: row.senderName[0] };
    this.realtime.broadcastTripEvent(tripId, 'chat.message.created', { message });
    return message;
  }
  async clear(tripId: string, userId: string) {
    const { role } = await this.access.requireMember(tripId, userId, true);
    if (role !== TripRole.OWNER && role !== TripRole.ADMIN) throw new ForbiddenException('Only trip managers can clear chat');
    await this.db.delete(chatMessages).where(eq(chatMessages.tripId, tripId));
    this.realtime.broadcastTripEvent(tripId, 'chat.cleared', {});
    return { success: true };
  }
  private async publicDocument(row: typeof documents.$inferSelect, unlocked = false) {
    const locked = !!row.pinDigest && !unlocked;
    const metadata = row.metadata || {};
    let fileUrl: string | undefined;
    if (!locked && row.fileUrl) {
      const { bucket } = this.storageConfig();
      const response = await this.storage(`/object/sign/${bucket}/${row.fileUrl}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 300 }) });
      const data = await response.json();
      const { url } = this.storageConfig();
      if (!data.signedURL) throw new ServiceUnavailableException('Document download unavailable');
      fileUrl = `${url}${data.signedURL}`;
    }
    return { ...metadata, id: row.id, title: row.title, category: row.category, createdAt: row.createdAt.toISOString(),
      isLocked: !!row.pinDigest, provider: metadata.provider || '', referenceNumber: locked ? '' : metadata.referenceNumber || '',
      notes: locked ? '' : metadata.notes, fileUrl, fileSize: `${Math.round(row.fileSize / 1024)} KB` };
  }
  async listDocuments(tripId: string, userId: string) {
    await this.access.requireMember(tripId, userId);
    const rows = await this.db.query.documents.findMany({ where: eq(documents.tripId, tripId), orderBy: [desc(documents.createdAt)] });
    return Promise.all(rows.map(row => this.publicDocument(row)));
  }
  async addDocument(tripId: string, userId: string, input: z.infer<typeof documentSchema>) {
    await this.access.requireMember(tripId, userId, true);
    const { pin, isLocked, fileUrl: dataUrl, title, category, ...metadata } = input;
    const id = randomUUID();
    let filePath = '', fileType = 'none', fileSize = 0;
    if (dataUrl) {
      const match = /^data:(application\/pdf|image\/jpeg|image\/png|image\/webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
      if (!match) throw new BadRequestException('Upload a PDF, JPEG, PNG or WEBP file');
      const bytes = Buffer.from(match[2], 'base64');
      if (!bytes.length || bytes.length > 5 * 1024 * 1024) throw new BadRequestException('File must be between 1 byte and 5 MB');
      const valid = match[1] === 'application/pdf' ? bytes.subarray(0, 5).toString() === '%PDF-' :
        match[1] === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 :
        match[1] === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) :
        bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
      if (!valid) throw new BadRequestException('File contents do not match its type');
      const { bucket } = this.storageConfig();
      // Refuse a public bucket: a signed URL alone does not make public objects private.
      const bucketResponse = await this.storage(`/bucket/${bucket}`, { method: 'GET' });
      if ((await bucketResponse.json()).public !== false) throw new ServiceUnavailableException('Document bucket must be private');
      filePath = `${tripId}/${id}`; fileType = match[1]; fileSize = bytes.length;
      await this.storage(`/object/${bucket}/${filePath}`, { method: 'POST', headers: { 'Content-Type': fileType }, body: bytes as any });
    }
    const salt = randomBytes(16).toString('hex');
    const pinDigest = isLocked ? `${salt}:${scryptSync(pin, salt, 32).toString('hex')}` : null;
    let row: typeof documents.$inferSelect;
    try {
      [row] = await this.db.insert(documents).values({ id, tripId, userId, title, category, metadata, pinDigest, fileUrl: filePath, fileType, fileSize } as any).returning();

    } catch (err) {
      if (filePath) { const { bucket } = this.storageConfig(); await this.storage(`/object/${bucket}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [filePath] }) }).catch(() => undefined); }
      throw err;
    }
    return this.publicDocument(row);
  }
  async unlock(tripId: string, id: string, userId: string, pin: string) {
    await this.access.requireMember(tripId, userId);
    const row = await this.db.query.documents.findFirst({ where: and(eq(documents.tripId, tripId), eq(documents.id, id)) });
    if (!row) throw new NotFoundException('Document not found');
    if (row.pinDigest) {
      const [salt, hash] = row.pinDigest.split(':');
      if (!timingSafeEqual(scryptSync(pin, salt, 32), Buffer.from(hash, 'hex'))) throw new ForbiddenException('Incorrect PIN');
    }
    return this.publicDocument(row, true);
  }
  async removeDocument(tripId: string, id: string, userId: string) {
    const { role } = await this.access.requireMember(tripId, userId, true);
    const row = await this.db.query.documents.findFirst({ where: and(eq(documents.tripId, tripId), eq(documents.id, id)) });
    if (!row) throw new NotFoundException('Document not found');
    if (row.userId !== userId && role !== TripRole.OWNER && role !== TripRole.ADMIN) throw new ForbiddenException('Only uploader or trip managers can delete this document');
    if (row.fileUrl) { const { bucket } = this.storageConfig(); await this.storage(`/object/${bucket}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [row.fileUrl] }) }); }
    await this.db.delete(documents).where(and(eq(documents.id, id), eq(documents.tripId, tripId)));
    return { success: true };
  }
}

@Controller('trips/:tripId')
@UseGuards(AuthGuard)
class CollaborationController {
  constructor(private service: CollaborationService) {}
  @Get('chat') messages(@Param('tripId') tripId: string, @CurrentUser('id') id: string) { return this.service.messages(tripId, id); }
  @Post('chat') send(@Param('tripId') tripId: string, @CurrentUser() user: any, @Body(new ZodValidationPipe(messageSchema)) body: z.infer<typeof messageSchema>) { return this.service.send(tripId, user, body); }
  @Delete('chat') clear(@Param('tripId') tripId: string, @CurrentUser('id') id: string) { return this.service.clear(tripId, id); }
  @Get('documents') documents(@Param('tripId') tripId: string, @CurrentUser('id') id: string) { return this.service.listDocuments(tripId, id); }
  @Post('documents') add(@Param('tripId') tripId: string, @CurrentUser('id') id: string, @Body(new ZodValidationPipe(documentSchema)) body: z.infer<typeof documentSchema>) { return this.service.addDocument(tripId, id, body); }
  @Post('documents/:id/unlock') unlock(@Param('tripId') tripId: string, @Param('id') id: string, @CurrentUser('id') userId: string, @Body(new ZodValidationPipe(z.object({ pin: z.string().max(12).default('') }))) body: { pin: string }) { return this.service.unlock(tripId, id, userId, body.pin); }
  @Delete('documents/:id') remove(@Param('tripId') tripId: string, @Param('id') id: string, @CurrentUser('id') userId: string) { return this.service.removeDocument(tripId, id, userId); }
}

@Module({ providers: [CollaborationService], controllers: [CollaborationController] })
export class CollaborationModule {}
