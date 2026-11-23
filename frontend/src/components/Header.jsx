import { Link } from "react-router-dom";
import { useTutorialActions } from "./TutorialActionContext"
import "../styles/Header.css"
function Header({ onStartTutorial, onOpenTips }) {
    const { reportTutorialAction } = useTutorialActions();
    return (
        <div id="header">
            <Link to={"/search"} id="logo-app-name-container">
                <img id="logo" src="../images/logo.png"></img>
                <span id="app-name">AntIEligible</span>
            </Link>
            <nav id="nav-bar" data-tour="app-tabs">
                <Link to={"/search"} className="nav-item" data-tour="search-tab" on-click={() => reportTutorialAction("workspace-tab-opened", { tab: "search" })}>Search</Link>
                <Link to={"/planner"} className="nav-item" data-tour="planner-tab" onClick={() => reportTutorialAction("workspace-tab-opened", { tab: "planner" })}>Planner</Link>
                <button className="nav-item nav-action" type="button" onClick={onStartTutorial}>Tutorial</button>
                <button className="nav-item nav-action" type="button" onClick={onOpenTips}>Tips</button>
            </nav>
        </div>
    );
}

export default Header;