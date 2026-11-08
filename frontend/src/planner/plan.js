// Planner data, seeing which quarters and years each class is in, organization for years and quarters

export const QUARTERS = ["Fall", "Winter", "Spring", "Summer"];
export const MAX_YEARS = 8;

// Creates an empty year, year is an object full of its id and an object (quarters) where each key corresponds to an array of courses
export function emptyYear(id) {
    const quarters = {};
    for (const quarter of QUARTERS) {
        quarters[quarter] = [];
    }
    return {id, quarters};
}

// Empty, 1 year with no classes
export function emptyPlan() {
    return {years: [emptyYear(1)]};
}

// Adds a course to the end of one quarter
export function addCourse(plan, yearId, quarter, course) {
    return {
        years: plan.years.map((year) =>
            year.id === yearId ? {...year, quarters: {...year.quarters, [quarter]: [...year.quarters[quarter], course]}} : year
        ),
    };
}

// Removes a course from wherever it is planned
export function removeCourse(plan, courseId) {
    return {
        years: plan.years.map((year) => {
            const quarters = {};
            for (const quarter of QUARTERS) {
                quarters[quarter] = year.quarters[quarter].filter((course) => course.id !== courseId);
            }
            return { ...year, quarters };
        }),
    };
}

// Returns the yearId, yearNumber, and quarter of the course if it exists or null if it doesnt
export function findCourse(plan, courseId) {
    for (const [index, year] of plan.years.entries()) {
        for (const quarter of QUARTERS) {
            if (year.quarters[quarter].some((course) => course.id === courseId)) {
                return {yearId: year.id, yearNumber: index + 1, quarter};
            }
        }
    }
    return null;
}

export function countCourses(year) {
    return QUARTERS.reduce((total, quarter) => total + year.quarters[quarter].length, 0);
}

// Adds an empty year, does nothing if already have too many years
export function addYear(plan) {
    if (plan.years.length >= MAX_YEARS) {
        return plan;
    }
    const nextId = Math.max(0, ...plan.years.map((year) => year.id)) + 1;
    return {years: [...plan.years, emptyYear(nextId)]};
}

// User will click on a year to remove, removes it
export function removeYear(plan, yearId) {
    if (plan.years.length <= 1) {
        return plan;
    }
    return {years: plan.years.filter((year) => year.id !== yearId)};
}

// Format in the same way the graph labels its nodes
export function courseLabel(course) {
    return `${course.department} ${course.course_number}`;
}

// The units it has
export function unitsLabel(course) {
    const min = course.min_units;
    const max = course.max_units;
    if (min == null) {
        return "";
    }
    if (max == null || min === max) {
        return `${min} ${min === 1 ? "unit" : "units"}`;
    }
    return `${min}-${max} units`;
}

// Search result to a planner course obj
export function toPlannedCourse(result) {
    return {id: result.id, label: courseLabel(result), title: result.title, units: unitsLabel(result)};
}