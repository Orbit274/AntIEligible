// Fake data for now. Each class lists the ids of its prerequisites.
// This is the same shape your SQL table will likely have
// (one row per class + a list/table of prereq ids), so swapping
// this file for a real API call later will be easy.
//
// NOTE: prerequisites here are simplified examples, not the official catalog.

export const classes = {
  "ICS 31": { name: "Intro to Programming", prereqs: [] },
  "ICS 32": { name: "Programming with Software Libraries", prereqs: ["ICS 31"] },
  "ICS 33": { name: "Intermediate Programming", prereqs: ["ICS 32"] },
  "ICS 45C": { name: "Programming in C/C++", prereqs: ["ICS 33"] },
  "ICS 6B": { name: "Boolean Logic & Discrete Structures", prereqs: [] },
  "ICS 6D": { name: "Discrete Math for CS", prereqs: ["ICS 6B"] },
  "ICS 46": { name: "Data Structures", prereqs: ["ICS 45C", "ICS 6D"] },
  "CS 161": { name: "Design & Analysis of Algorithms", prereqs: ["ICS 46", "ICS 6D"] },
};

// Classes the student has already finished (later this comes from the user's account)
export const startingCompleted = ["ICS 31", "ICS 32", "ICS 6B"];

// Classes the student is taking or planning to take (the roots of each tree)
export const plannedClasses = ["CS 161"];
