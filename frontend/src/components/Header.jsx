import { Link } from "react-router-dom";
import "../styles/Header.css"
function Header() {
    return (
        <div id="header">
            <Link to={"/"} id="logo-app-name-container">
                <img id="logo" src="../images/logo.png"></img>
                <span id="app-name">AntIEligible</span>
            </Link>
            <nav id="nav-bar">
                <Link to={"/search"} className="nav-item">Search</Link>
                <Link to={"/planner"} className="nav-item">Planner</Link>
            </nav>
        </div>
    );
}

export default Header;