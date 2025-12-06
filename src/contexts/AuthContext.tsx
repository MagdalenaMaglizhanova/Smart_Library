import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

interface UserData {
  displayName: string;
  uid: string;
  email: string;
  role: "admin" | "librarian" | "reader";
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((firebaseUser) => {
      const fetchUserData = async () => {
        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));

          // fallback на "reader", ако няма role
          const role = snap.exists() && snap.data()?.role
            ? (snap.data()!.role as "admin" | "librarian" | "reader")
            : "reader";

          setUser({
  uid: firebaseUser.uid,
  email: firebaseUser.email || "",
  displayName: firebaseUser.displayName || "", // <- добавено
  role,
});

        } catch (error) {
          console.error("Error fetching user data:", error);
          // fallback, ако има проблем с Firestore
          setUser({
  uid: firebaseUser.uid,
  email: firebaseUser.email || "",
  displayName: firebaseUser.displayName || "",
  role: "reader",
});
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
