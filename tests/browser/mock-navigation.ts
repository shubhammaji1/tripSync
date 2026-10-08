export function useParams() { return { id: '20000000-0000-4000-8000-000000000001' }; }
export function useSearchParams() { return new URLSearchParams(location.search); }
export function useRouter() { return { push: () => {}, replace: () => {} }; }
