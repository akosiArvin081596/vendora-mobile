import "./global.css";
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
import DOMErrorBoundary from "./src/components/DOMErrorBoundary";

export default function App() {
  return (
    <DOMErrorBoundary>
      <AuthProvider>
        <AdminProvider>
          <ProductProvider>
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
          </ProductProvider>
        </AdminProvider>
      </AuthProvider>
    </DOMErrorBoundary>
  );
}
