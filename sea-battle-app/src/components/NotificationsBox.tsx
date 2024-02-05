import {State} from "../store";
import {useDispatch, useSelector} from "react-redux";
import appStyle from "../style/app.module.scss";
import {notificationActions} from "../store/notificationSlice.ts";

export default function NotificationsBox() {
    const notifications = useSelector((state: State) => state.notifications)
    const dispatch = useDispatch()

    return (
        <div className={appStyle.notificationsBox}>
            {notifications.map((notification, index) => (
                <div key={index} className={`${appStyle.notification} ${appStyle[notification.type]}`}
                     onClick={() => dispatch(notificationActions.removeNotification(notification.id))}>
                    {notification.message}
                </div>
            ))}
        </div>
    )
}