import {useSelector} from "react-redux";
import {State} from "./store";
import EnterUsernamePage from "./components/EnterNicknamePage.tsx";
import MainMenu from "./components/MainMenu.tsx";
import Game from "./components/game/Game.tsx";
import PreGameLobby from "./components/game/PreGameLobby.tsx";

function App() {
    const loggedIn = useSelector((state: State) => state.user.username != null)
    const currentGame = useSelector((state: State) => state.game)

    if (!loggedIn)
        return <EnterUsernamePage/>

    if (!currentGame)
        return <MainMenu/>

    if (!currentGame.isStarted)
        return <PreGameLobby/>

    return <Game/>
}

export default App
