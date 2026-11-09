import { createContext, useContext } from "react";

const CourseContext = createContext(null);

export function useCourseContext() {
  return useContext(CourseContext);
}

export default CourseContext;
