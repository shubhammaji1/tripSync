import React from 'react';
import { createRoot } from 'react-dom/client';
import TripPage from '../../apps/web/src/app/trips/[id]/page';
import { api } from '../../apps/web/src/lib/api';
const owner = '10000000-0000-4000-8000-000000000001';
const mode = new URLSearchParams(location.search).get('mode');
api.getMe = async () => ({ id: owner, email: 'fixture@example.com', fullName: 'Fixture traveler' } as any);
api.getTripById = async () => {
  if (mode === 'error') throw new Error('Trip service unavailable');
  return { id: '20000000-0000-4000-8000-000000000001', name: 'Saved Goa trip', destination: 'Goa, India', ownerId: owner,
    startDate: '2026-11-15', endDate: '2026-11-19', currency: 'INR', budget: 50000,
    members: [{ userId: owner, role: 'OWNER', user: { id: owner, fullName: 'Fixture traveler', email: 'fixture@example.com' } }],
    days: [], expenses: [], tasks: [], emergencyContacts: [] } as any;
};
api.getEmergencyContacts = async () => [];
api.getSettlements = async () => ({ optimizedTransfers: [], balances: [] } as any);
api.getTrailWatchOverview = async () => ({ weatherError: 'No fixture weather', latestWeather: null } as any);
createRoot(document.getElementById('root')!).render(<TripPage />);
