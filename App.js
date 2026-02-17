import "./global.css";
import "./src/utils/timezone";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { ProductProvider } from "./src/context/ProductContext";
import { OrderProvider } from "./src/context/OrderContext";
import { CustomerProvider } from "./src/context/CustomerContext";
import { CartProvider } from "./src/context/CartContext";
import { ReviewProvider } from "./src/context/ReviewContext";
import { AuthProvider } from "./src/context/AuthContext";
import { AdminProvider } from "./src/context/AdminContext";
import { SocketProvider } from "./src/context/SocketContext";
import { NetworkProvider } from "./src/context/NetworkContext";
import { SyncProvider } from "./src/context/SyncContext";
import { LedgerProvider } from "./src/context/LedgerContext";
import DOMErrorBoundary from "./src/components/DOMErrorBoundary";
import { getDatabase } from "./src/db/database";
import { registerBackgroundSync } from "./src/tasks/backgroundSync";

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    try {
      getDatabase();
      setDbReady(true);
      console.log("[App] SQLite database ready.");
      // Register background sync task
      registerBackgroundSync().catch((err) =>
        console.warn("[App] Background sync registration failed:", err.message)
      );
    } catch (error) {
      console.error("[App] Failed to initialize database:", error);
      // Still allow app to function in online-only mode
      setDbReady(true);
    }
  }, []);

  if (!dbReady) {
    return null;
  }

  return (
    <DOMErrorBoundary>
      <NetworkProvider>
        <AuthProvider>
          <SyncProvider>
            <AdminProvider>
              <ProductProvider>
                <LedgerProvider>
                <OrderProvider>
                  <SocketProvider>
                    <CustomerProvider>
                      <CartProvider>
                        <ReviewProvider>
                          <SafeAreaProvider>
                            <StatusBar style="light" backgroundColor="#1a1025" />
                            <NavigationContainer>
                              <RootNavigator />
                            </NavigationContainer>
                          </SafeAreaProvider>
                        </ReviewProvider>
                      </CartProvider>
                    </CustomerProvider>
                  </SocketProvider>
                </OrderProvider>
                </LedgerProvider>
              </ProductProvider>
            </AdminProvider>
          </SyncProvider>
        </AuthProvider>
      </NetworkProvider>
    </DOMErrorBoundary>
  );
}
