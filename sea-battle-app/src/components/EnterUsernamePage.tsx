import {FormEvent, useState} from "react";
import appStyle from "../style/app.module.scss"
import {useDispatch} from "react-redux";
import {actions} from "../store/userSlice.ts";
import useSocket from "../socket/useSocket.ts";

export default function EnterUsernamePage() {
    const [input, setInput] = useState("")
    const dispatch = useDispatch()
    const [error, setError] = useState(null as string | null)
    const socket = useSocket()

    function save(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (input.length < 3)
            return setError("Username is too short!")

        if (input.length > 16)
            return setError("Username is too long!")

        socket.emit("set_username", input, (error: boolean, message?: string) => {
            if (error)
                return setError(message!)

            dispatch(actions.setUsername(input))
        })
    }

    return (
        <div className={appStyle.centeredContainer}>
            <form onSubmit={save} className={`${appStyle.box} ${appStyle.enterUsernameBox}`}>
                <h1>
                    Enter your username
                </h1>
                <div className={appStyle.inputBox}>
                    <input type={"text"}
                           value={input}
                           onChange={e => setInput(e.target.value)}/>
                </div>
                {error &&
                    <div className={appStyle.errorBox}>
                        {error}
                    </div>}
                <button>
                    Done
                </button>
            </form>
        </div>
    )
}