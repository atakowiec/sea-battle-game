import {State} from "../store";
import {useDispatch, useSelector} from "react-redux";
import appStyle from "../style/app.module.scss";
import {notificationActions} from "../store/notificationSlice.ts";

export default function NotificationsBox() {
    const notifications = useSelector((state: State) => state.notifications)
    const dispatch = useDispatch()

    return (
        <>
            {notifications.some(notification => notification.type === 'alert') &&
                <div className={appStyle.notificationAlertBox} onClick={() => dispatch(notificationActions.removeNotificationsOfType("alert"))}>
                    {notifications.filter(notification => notification.type === 'alert').map((notification) => (
                        <div key={notification.id} className={`${appStyle.notification} ${appStyle[notification.type]}`}
                             onClick={() => dispatch(notificationActions.removeNotification(notification.id))}>
                            {notification.title && <h3>{notification.title}</h3>}
                            {notification.message}
                        </div>
                    ))}
                </div>}
            <div className={appStyle.notificationsBox}>
                {notifications.filter(notifications => notifications.type !== "alert").map((notification, index) => (
                    <div key={index} className={`${appStyle.notification} ${appStyle[notification.type]}`}
                         onClick={() => dispatch(notificationActions.removeNotification(notification.id))}>
                        {notification.message}
                    </div>
                ))}
            </div>
        </>
    )
}