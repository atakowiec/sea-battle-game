import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import {Provider} from "react-redux";
import {store} from "./store";
import {SocketProvider} from "./socket/SocketProvider.tsx";
import NotificationsBox from "./components/NotificationsBox.tsx";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Provider store={store}>
            <SocketProvider>
                <NotificationsBox/>
                <App/>
            </SocketProvider>
        </Provider>
    </React.StrictMode>
)
