import {useSelector} from "react-redux";
import {State} from "./store";
import EnterUsernamePage from "./components/EnterUsernamePage.tsx";
import MainMenu from "./components/MainMenu.tsx";
import Game from "./components/game/Game.tsx";
import PreGameLobby from "./components/game/PreGameLobby.tsx";

function App() {
    const user = useSelector((state: State) => state.user)
    const currentGame = useSelector((state: State) => state.game)

    if (!user.usernameChecked)
        return;

    if (!user.username)
        return <EnterUsernamePage/>

    if (!currentGame)
        return <MainMenu/>

    if (currentGame.status === "lobby")
        return <PreGameLobby/>

    return <Game/>
}

export default App
