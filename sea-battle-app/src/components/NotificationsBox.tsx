import {State} from "../store";
import {useSelector} from "react-redux";
import appStyle from "../style/app.module.scss";

export default function NotificationsBox() {
    const notifications = useSelector((state: State) => state.notifications)

    return (
        <div className={appStyle.notificationsBox}>
            {notifications.map((notification, index) => (
                <div key={index} className={`${appStyle.notification} ${appStyle[notification.type]}`}>
                    {notification.message}
                </div>
            ))}
        </div>
    )
}