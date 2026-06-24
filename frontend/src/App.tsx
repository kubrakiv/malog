import { RouterProvider } from "react-router-dom";

import OpenContextProvider from "./components/OpenContextProvider/OpenContextProvider.jsx";
import { SovtesRealtimeProvider } from "./contexts/SovtesRealtimeContext.jsx";

import router from "./router.jsx";

function App() {
  return (
    <SovtesRealtimeProvider>
      <OpenContextProvider>
        <RouterProvider router={router}></RouterProvider>
      </OpenContextProvider>
    </SovtesRealtimeProvider>
  );
}

export default App;
