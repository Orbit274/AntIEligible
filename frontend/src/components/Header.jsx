import "../styles/Header.css"
function Header() {
    return (
        <div id="header">
            Logo goes here <img id="logo" src=""></img>
            <a id="app-name" href="">AntIEligible</a>
            <nav>
                <ul>
                    <li><a href="">About</a></li>
                </ul>
            </nav>
        </div>
    );
}

export default Header;