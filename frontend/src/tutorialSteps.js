export const TUTORIAL_STEPS = [
    {
        path: "/search",
        title: "Welcome to AntIEligible!",
        description: "This quick tour will show you how to explore UCI prerequisites, understand course eligibility, track your progress, and plan future classes.",
        note: "You can close this tutorial at any time by clicking outside this panel or pressing Esc.",
        placement: "center",
        buttonLabel: "Get started",
    },
    {
        path: null,
        target: '[data-tour="app-tabs"]',
        title: "Two main workspaces",
        description: "Search is where you explore prerequisite relationships. Planner is where you organize courses by year and quarter. You can switch between them here.",
        placement: "bottom",
    },
    {
        path: "/search",
        // Spotlight only the input and matching result, not the whole search toolbar.
        // The search result target appears dynamically after the user types.
        targets: ['[data-tour="course-search-input"]', '[data-tour="course-search-result"]'],
        title: "Find your target course",
        description: "Search by course code or title. Selecting a result builds its prerequisite graph. Use First layer for direct prerequisites or Full tree to explore the full chain.",
        // Put the instruction panel beside the input so it does not cover the dropdown.
        placement: "right",
        task: {
            prompt: "Try it: search for the course and select it from the dropdown.",
            actions: [
                {
                    id: "graph-search-query",
                    event: "search-query-entered",
                    match: { context: "graph", normalizedQuery: "COMPSCI161" },
                    label: "Type COMPSCI 161 into the search field",
                },
                {
                    id: "graph-course-selected",
                    event: "graph-course-selected",
                    match: { courseId: "COMPSCI161" },
                    label: "Choose COMPSCI 161 from the search results",
                },
            ],
        }
    },
    {
        path: "/search",
        target: '#course-detail-panel',
        allowInteractionTargets: ['#course-detail-overlay'],
        escapeClosesTarget: '#course-detail-overlay.show',
        title: "Explore the course viewer",
        description: "The course viewer shows the course description, units, department, and prerequisite information. You can close it with the X or by clicking the dimmed area around the panel.",
        placement: "left",
        task: {
            prompt: "Try it: close the viewer using its X, the dimmed backdrop, or Escape.",
            actions: [
                {
                    id: "close-course-viewer",
                    event: "course-details-closed",
                    match: { courseId: "COMPSCI161" },
                    label: "Close the COMPSCI 161 course viewer",
                },
            ],
        },
    },
    {
        path: "/search",
        target: '[data-tour="graph-canvas"]',
        title: "Move around the prerequisite map",
        description: "You can rearrange nodes, pan the map, and zoom in to inspect individual courses. These controls change your view of the graph, not the course requirements themselves.",
        placement: "top",
        panelLocation: {
            top: 68,
            right: 20
        },
        task: {
            prompt: "Try all three: move a node, pan the empty canvas, then zoom in once.",
            actions: [
                {
                    id: "move-graph-node",
                    event: "graph-course-node-moved",
                    match: { courseId: "COMPSCI161" },
                    label: "Drag the COMPSCI 161 node to a new position",
                },
                {
                    id: "pan-graph-canvas",
                    event: "graph-canvas-panned",
                    label: "Drag an empty area to pan the graph",
                },
                {
                    id: "zoom-graph-in",
                    event: "graph-zoom-in-used",
                    label: "Click Zoom In once",
                },
            ],
        },
    },
    {
        path: "/search",
        target: '[data-tour="root-expand-control"]',
        title: "Expand and collapse prerequisites",
        description: "The arrow on a course node reveals or hides its prerequisite branch. First collapse the COMPSCI 161 branch, then expand it again. You do not need to open every branch—focus on courses relevant to your goals.",
        placement: "left",
        task: {
            prompt: "Try it: collapse the branch, then expand it again.",
            actions: [
                {
                    id: "collapse-course-branch",
                    event: "course-branch-collapsed",
                    match: { courseId: "COMPSCI161" },
                    label: "Collapse the COMPSCI 161 prerequisites",
                },
                {
                    id: "expand-course-branch",
                    event: "course-branch-expanded",
                    match: { courseId: "COMPSCI161" },
                    label: "Expand the prerequisites again",
                },
            ],
        },
    },
    {
        path: "/search",
        targets: ['[data-tour="root-progress-control"]', '[data-tour="mark-in-progress-option"]'],
        title: "Mark your course progress",
        description: "Each course has a status control. Open it and choose In-progress for COMPSCI 161. Completed, In-progress, and Not-started statuses change the node's appearance and help the app evaluate your progress.",
        placement: "left",
        panelLocation: {
            top: 68,
            right: 20
        },
        task: {
            prompt: "Try it: open the status menu and set COMPSCI 161 to In-progress.",
            actions: [
                {
                    id: "open-status-menu",
                    event: "course-status-menu-opened",
                    match: { courseId: "COMPSCI161" },
                    label: "Open the course status menu",
                },
                {
                    id: "set-course-in-progress",
                    event: "course-status-updated",
                    match: { courseId: "COMPSCI161", status: "in-progress" },
                    label: "Choose In-progress",
                },
            ],
        },
    },
    {
        path: "/search",
        target: '[data-tour="progress-tracker"]',
        title: "Keep track of your progress",
        description: "Courses you mark Completed or In-progress also appear in the Course Tracker on the left. The counters show how many courses you have recorded in each category.",
        placement: "right",
    },
    {
        path: "/search",
        target: '[data-tour="graph-legend"]',
        title: "Understand the graph legend",
        description: "The legend explains the graph's direction, expand/collapse controls, and status colors. Solid connections represent AND requirements; dashed connections and OR nodes show alternative ways to satisfy a requirement.",
        placement: "left",
    },
    {
        path: null,
        target: '[data-tour="planner-tab"]',
        title: "Open your Planner",
        description: "Now let's switch workspaces. Click Planner in the top navigation. The Planner organizes your classes by academic year and quarter.",
        placement: "bottom",
        task: {
            prompt: "Try it: click the Planner tab in the header.",
            actions: [
                {
                    id: "open-planner-tab",
                    event: "workspace-tab-opened",
                    match: { tab: "planner" },
                    label: "Open the Planner workspace",
                },
            ],
        },
    },
    {
        path: "/planner",
        target: '[data-tour="planner-search-area"]',
        title: "Search for a class to plan",
        description: "Use this search field to find a course you want to schedule. Type COMPSCI 161 and wait for the matching result to appear. In the next step, you will drag that result into a quarter.",
        placement: "bottom",
        task: {
            prompt: "Try it: search for COMPSCI 161 and wait for it to appear in the dropdown.",
            actions: [
                {
                    id: "planner-search-query",
                    event: "search-query-entered",
                    match: { context: "planner", normalizedQuery: "COMPSCI161" },
                    label: "Type COMPSCI 161 into Planner search",
                },
                {
                    id: "planner-search-results",
                    event: "search-results-loaded",
                    match: {
                        context: "planner",
                        normalizedQuery: "COMPSCI161",
                        includesCourseId: "COMPSCI161",
                    },
                    label: "Wait for COMPSCI 161 to appear in the results",
                },
            ],
        },
    },
    {
        path: "/planner",
        focusTarget: '[data-tour="planner-search-input"]',
        targets: ['[data-tour="planner-search-result"]', '[data-tour="planner-drop-target"]'],
        title: "Drop a class into a quarter",
        description: "Grab COMPSCI 161 from the search results and drop it into Year 1 · Fall. You can also click a search result to view its details and add it with the course viewer button.",
        placement: "right",
        task: {
            prompt: "Try it: drag the COMPSCI 161 search result into Year 1 · Fall.",
            actions: [
                {
                    id: "add-course-to-planner",
                    event: "planner-course-added",
                    match: { courseId: "COMPSCI161", yearId: 1, quarter: "Fall" },
                    label: "Drop COMPSCI 161 into Year 1 · Fall",
                },
            ],
        },
    },
    {
        path: "/planner",
        targets: ['[data-tour="planner-added-course"]', '[data-tour="planner-move-target"]'],
        title: "Move classes between quarters",
        description: "Courses already in your plan can be moved too. Drag the COMPSCI 161 card from Year 1 · Fall into Year 1 · Winter. The course is moved—not duplicated.",
        placement: "bottom",
        task: {
            prompt: "Try it: move COMPSCI 161 from Fall to Winter.",
            actions: [
                {
                    id: "move-course-in-planner",
                    event: "planner-course-moved",
                    match: {
                        courseId: "COMPSCI161",
                        fromYearId: 1,
                        fromQuarter: "Fall",
                        yearId: 1,
                        quarter: "Winter",
                    },
                    label: "Move the course into Year 1 · Winter",
                },
            ],
        },
    },
    {
        path: "/search",
        target: '[data-tour="graph-canvas"]',
        title: "You're ready to explore!",
        description: "You're back on Search with the starting COMPSCI 161 prerequisite map. The progress change used for this walkthrough has been restored, so the exercise does not change your course records. Search for another target course whenever you're ready, and open Tips in the header for reminders and planning advice.",
        placement: "top-right",
        buttonLabel: "Finish",
    },
];