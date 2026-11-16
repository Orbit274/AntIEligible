import axios from "axios";
import { useState, useEffect, useRef } from "react";
import "../styles/SearchBar.css";

// Search bar with dropdown of courses
// When user clicks a class, calls onCourseChosen(course), course is object from /api/search
export default function SearchBar({ onCourseChosen, onCourseDragStart }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const resultsRef = useRef(null);
  const pointerDownOnResult = useRef(false);
  const dragging = useRef(false);

  // Check where cursor was released and if the cursor was being dragged, if good then close the drop down search menu
  useEffect(() => {
    function handleWindowPointerUp(event) {
      if (!pointerDownOnResult.current) {
        return;
      }
      if (resultsRef.current?.contains(event.target)) {
        return;
      }
      pointerDownOnResult.current = false;
      if (!dragging.current) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerup", handleWindowPointerUp);
    return () => window.removeEventListener("pointerup", handleWindowPointerUp);
  }, []);

  // Runs when text changes, has 200ms delay
  useEffect(() => {
    let q = search.trim();
    if (!q) {
      return;
    }

    let controller = new AbortController();
    let timer = setTimeout(async () => {
      try {
        const response = await axios.get("/api/search", {
          params: { q },
          signal: controller.signal,
        });
        setResults(response.data);
        setOpen(true);
      } catch (e) {
        if (!axios.isCancel(e)) {
          console.error("Search failed: ", e);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  async function handleChange(event) {
    const text = event.target.value;
    setSearch(text);

    if (text.trim() === "") {
      setResults([]);
      return;
    }
  }

  function choose(course) {
    setSearch("");
    setResults([]);
    setOpen(false);
    onCourseChosen(course);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="search">
      <input
        type="text"
        placeholder="Search classes"
        value={search}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => {
            if (!pointerDownOnResult.current && !dragging.current) {
              setOpen(false);
            }
          }, 0);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {open && search.trim() && (
        <ul className="search-results" ref={resultsRef}>
          {results.length === 0 && (
            <li className="search-empty">No courses found</li>
          )}
          {results.map((course) => (
            <li 
              key={course.id} 
              onMouseDown={() => pointerDownOnResult.current = true}
              draggable={Boolean(onCourseDragStart)}
              onMouseUp={() => pointerDownOnResult.current = false}
              onClick={() => choose(course)}
              onDragStart={(event) => {
                if (!onCourseDragStart) {
                  return
                }
                dragging.current = true;
                onCourseDragStart(event, course);
              }}
              onDragEnd={() => {
                dragging.current = false;
                pointerDownOnResult.current = false;
                setOpen(false);
              }}
              title={onCourseDragStart ? "Click to view, or drag into a quarter to add" : undefined}
            >
              <strong>
                {course.department} {course.course_number}
              </strong>
              <span>{course.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}