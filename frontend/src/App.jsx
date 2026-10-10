import "./App.css";

import { useState } from "react";


const classes = {
  "ICS 31":  { name: "Intro to Programming", prereqs: [] },
  "ICS 32":  { name: "Programming with Software Libraries", prereqs: ["ICS 31"] },
  "ICS 33":  { name: "Intermediate Programming", prereqs: ["ICS 32"] },
  "ICS 45C": { name: "Programming in C/C++", prereqs: ["ICS 33"] },
  "ICS 6B":  { name: "Boolean Logic & Discrete Structures", prereqs: [] },
  "ICS 46":  { name: "Data Structures", prereqs: ["ICS 45C", "ICS 6B"] },
};

function ClassCard(props){

  const [status, setStatus] = useState("not-started");
  const info = classes[props.code];

  function nextStatus(){
    if(status == "not-started"){
      setStatus("in-progress");
    } else if (status == "in-progress"){
      setStatus("completed");
    } else{
      setStatus("not-started");
    }
  }

  let label = "No yet";
  if(status == "in-progress") label = "In progress";
  if(status == "completed") label = "Completed";


  return (
    <div>
      <div className={"class-card " + status} onClick={nextStatus}>
        <strong>{props.code}</strong>
        <p>{info.name}</p>
        <p>{label}</p>
      </div>

      <div className="prereqs">
        {info.prereqs.map((p) => (<ClassCard key={p} code = {p}/>))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div>
      <h2>My UCI Classes</h2>
      <ClassCard code = "ICS 46" />
    </div>
  );
}