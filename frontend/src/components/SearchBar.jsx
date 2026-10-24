import { useState } from "react";

export default function SearchBar() {
  const [text, setText] = useState("");
  const [results, setResults] = useState([]);   

  async function handleChange(event) {
    const newText = event.target.value;
    setText(newText);

    if (newText.trim() === "") {
      setResults([]);
      return;
    }

    const response = await fetch("/api/search?q=" + encodeURIComponent(newText));
    const data = await response.json();
    setResults(data);                            
  }

  return (
    <div className="search">
      <input
        type="text"
        placeholder="Search classes"
        value={text}
        onChange={handleChange}
      />

      {results.length > 0 && (
        <ul className="search-results">
          {results.map((course) => (
            <li key={course.id}>
              <strong>{course.department} {course.course_number}</strong>
              <span>{course.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}