import appStyle from "../style/app.module.scss"
import {useSelector} from "react-redux";
import {State} from "../store";
import {useRef} from "react";

export default function MainMenu() {
    const nickname = useSelector((state: State) => state.user.username)
    const gameIdRef = useRef(null)

    return (
        <div className={appStyle.centeredContainer}>
            <div className={`${appStyle.preGameMenu} ${appStyle.box}`}>
                <h1>Sea Battle Game!</h1>
                <h5>Hello {nickname}</h5>
                <div>
                    <button>
                        Create new game
                    </button>
                </div>
                <div className={appStyle.divider}>
                    or
                </div>
                <div>
                    <input ref={gameIdRef} placeholder="game id"/>
                </div>
                <div>
                    <button>
                        Join game
                    </button>
                </div>
            </div>
        </div>
    )
}