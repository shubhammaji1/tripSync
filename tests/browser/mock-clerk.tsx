export function useAuth() { return { isLoaded: true, userId: 'fixture-user', sessionId: 'fixture-session', getToken: async () => null }; }
export function useUser() { return { isLoaded: true, isSignedIn: true, user: { id: 'fixture-user', fullName: 'Fixture traveler' } }; }
