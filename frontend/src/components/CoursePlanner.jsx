import "../styles/CoursePlanner.css"
function Planner(){
    return(
        <div id="planner-container">
            <span id="planner-title">Planner</span>
            <div id="quarter-container">
                <div id="fall-quarter" className="quarter">
                    <span className="quarter-term">Fall</span>
                    <div className="planned-course-container">
                        <div className="planned-course"></div>
                        <div className="planned-course"></div>
                        <div className="planned-course"></div>
                    </div>
                </div>
                <div id="winter-quarter" className="quarter">
                    <span className="quarter-term">Winter</span>
                    <div className="planned-course-container">
                        <div className="planned-course"></div>
                    </div>
                </div>
                <div id="spring-quarter" className="quarter">
                    <span className="quarter-term">Spring</span>
                    <div className="planned-course-container">
                        <div className="planned-course"></div>
                    </div>
                </div>
                <div id="summer-quarter" className="quarter">
                    <span className="quarter-term">Summer</span>
                    <div className="planned-course-container">
                        <div className="planned-course"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Planner;