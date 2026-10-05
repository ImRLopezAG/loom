import { createContext, useCallback, useContext, useState } from "react";
import { createRoot } from "react-dom/client";
import { createKelloReact } from "kello/react";
import { createQueryClient } from "kello/client";

const ProviderAccount = createContext<string | null>(null);
const queryClient = createQueryClient();
queryClient.setQueryData(["unrelated"], "preserved");
let fetched = 0;
let disposed = 0;
let refreshed = 0;
const bindings = createKelloReact(({ getToken, cachePrefix }) => {
  let account: string | null = null;
  return {
    get account() {
      return account;
    },
    async verifySession() {
      account = await getToken();
      if (!account) throw new Error("Missing fixture token");
      queryClient.setQueryData([cachePrefix, "private"], account);
      return { key: account, expiresAt: Date.now() / 1000 + 3600 };
    },
    dispose() {
      disposed++;
    },
  };
});
function useProviderAuth() {
  const account = useContext(ProviderAccount);
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      fetched++;
      if (forceRefreshToken) refreshed++;
      return account;
    },
    [account],
  );
  return { isLoading: false, isAuthenticated: account !== null, fetchAccessToken };
}
function Consumer() {
  return <output>Account {bindings.useKello().account}</output>;
}
function App() {
  const [account, setAccount] = useState<string | null>("Alice");
  const [stats, setStats] = useState("");
  const [renders, setRenders] = useState(0);
  return (
    <ProviderAccount.Provider value={account}>
      <button onClick={() => setAccount("Bob")}>Switch to Bob</button>
      <button onClick={() => setAccount(null)}>Sign out</button>
      <button onClick={() => setAccount("Alice")}>Sign in Alice</button>
      <button onClick={() => setRenders(renders + 1)}>Rerender {renders}</button>
      <button
        onClick={() => {
          window.dispatchEvent(new Event("offline"));
          window.dispatchEvent(new Event("online"));
        }}
      >
        Refresh token
      </button>
      <button
        onClick={() =>
          setStats(
            JSON.stringify({
              fetched,
              disposed,
              refreshed,
              private: queryClient
                .getQueryCache()
                .getAll()
                .filter((query) => query.queryKey[1] === "private")
                .map((query) => query.state.data),
              unrelated: queryClient.getQueryData(["unrelated"]),
            }),
          )
        }
      >
        Inspect
      </button>
      <pre>{stats}</pre>
      <bindings.KelloProviderWithAuth
        url="https://example.test"
        useAuth={useProviderAuth}
        queryClient={queryClient}
        fallback={<p>Connecting</p>}
      >
        <Consumer />
      </bindings.KelloProviderWithAuth>
    </ProviderAccount.Provider>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<App />);
