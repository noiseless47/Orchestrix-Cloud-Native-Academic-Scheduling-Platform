const gatewayUrl = process.env.API_URL || "http://127.0.0.1:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${gatewayUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text };
  }
  if (!response.ok) {
    throw new Error(`${response.status} ${path}: ${body.message || text}`);
  }
  return body;
}

const subjects = [
  { subjectName: "Indian Knowledge System", subjectCode: "HS271TA", department: "ISE", semester: 7, defaultClassesPerWeek: 3 },
  { subjectName: "Virtual Reality & Augmented Reality", subjectCode: "IS372IA", department: "ISE", semester: 7, defaultClassesPerWeek: 4 },
  { subjectName: "Microservices Architecture", subjectCode: "IS373TA", department: "ISE", semester: 7, defaultClassesPerWeek: 4 },
  { subjectName: "Summer Internship", subjectCode: "IS376SI", department: "ISE", semester: 7, defaultClassesPerWeek: 3 },
  { subjectName: "Major Project", subjectCode: "IS481P", department: "ISE", semester: 8, defaultClassesPerWeek: 12 },

  // VII Sem: Professional Core Electives IV (Group F)
  { subjectName: "Development and Operations (DevOps)", subjectCode: "IS374TFA", department: "ISE", semester: 7, electiveGroup: "F", defaultClassesPerWeek: 3 },
  { subjectName: "Cyber Security for Industry 4.0", subjectCode: "CS374TFB", department: "CS", semester: 7, electiveGroup: "F", defaultClassesPerWeek: 3 },
  { subjectName: "Ethical Artificial Intelligence", subjectCode: "AI374TFC", department: "AI", semester: 7, electiveGroup: "F", defaultClassesPerWeek: 3 },
  { subjectName: "MERN Stack Development", subjectCode: "IS374TFD", department: "ISE", semester: 7, electiveGroup: "F", defaultClassesPerWeek: 3 },

  // VII Sem: Institutional Electives II (Group G)
  { subjectName: "Data and Story Telling", subjectCode: "AI375TGA", department: "AI", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Aircraft Systems", subjectCode: "AS375TGB", department: "AS", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Health Care Technology for Engineers", subjectCode: "BT375TGC", department: "BT", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Green and Hydrogen Technology", subjectCode: "CH375TGD", department: "CH", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Chemistry of Materials and Molecular Analysis", subjectCode: "CM375TGE", department: "CM", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Prompt Engineering", subjectCode: "CS375TGF", department: "CS", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Solid Waste Management and Statutory Rules", subjectCode: "CV375TGG", department: "CV", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Freight Transportation Systems and Logistics", subjectCode: "CV375TGH", department: "CV", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "IoT for Smart Systems", subjectCode: "EC375TGI", department: "EC", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "E Mobility", subjectCode: "EE375TGJ", department: "EE", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Disease and Diagnostics an Engineering Perspective", subjectCode: "EI375TGK", department: "EI", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Space Technology and Applications", subjectCode: "ET375TGL", department: "ET", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Project Management", subjectCode: "IM375TGM", department: "IM", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Global Supply Chain Management", subjectCode: "IM375TGN", department: "IM", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Statistical Methods for Engineers", subjectCode: "MA375TGO", department: "MA", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Industry 5.0", subjectCode: "ME375TGP", department: "ME", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Principles of Astrophysics", subjectCode: "PY375TGQ", department: "PY", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Mathematics of Music", subjectCode: "MA375TGR", department: "MA", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Cognitive Psychology", subjectCode: "HS375TGS", department: "HS", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },
  { subjectName: "Principles & Practices of Cyber Law", subjectCode: "HS375TGT", department: "HS", semester: 7, electiveGroup: "G", defaultClassesPerWeek: 3 },

  // V Sem: Core & Professional Core Electives (Group B, C)
  { subjectName: "Principles of Management and Economics", subjectCode: "HS251TA", department: "ISE", semester: 5, defaultClassesPerWeek: 3 },
  { subjectName: "Database Management Systems", subjectCode: "CD252IA", department: "ISE", semester: 5, defaultClassesPerWeek: 4 },
  { subjectName: "Artificial Intelligence and Machine Learning", subjectCode: "IS353IA", department: "ISE", semester: 5, defaultClassesPerWeek: 4 },
  { subjectName: "Theory of Computation", subjectCode: "CS354TA", department: "ISE", semester: 5, defaultClassesPerWeek: 4 },
  { subjectName: "Management Information Systems", subjectCode: "IS255TBA", department: "ISE", semester: 5, electiveGroup: "B", defaultClassesPerWeek: 3 },
  { subjectName: "Advanced Algorithms", subjectCode: "CS355TBB", department: "ISE", semester: 5, electiveGroup: "B", defaultClassesPerWeek: 3 },
  { subjectName: "Natural Language Processing", subjectCode: "IS355TBC", department: "ISE", semester: 5, electiveGroup: "B", defaultClassesPerWeek: 3 },
  { subjectName: "Cloud Computing", subjectCode: "IS355TBD", department: "ISE", semester: 5, electiveGroup: "B", defaultClassesPerWeek: 3 },
  { subjectName: "Secure Systems Engineering", subjectCode: "AI256TCA", department: "ISE", semester: 5, electiveGroup: "C", defaultClassesPerWeek: 2 },
  { subjectName: "Data Mining", subjectCode: "IS256TCB", department: "ISE", semester: 5, electiveGroup: "C", defaultClassesPerWeek: 2 },
  { subjectName: "Foundation of Cloud IoT Edge ML", subjectCode: "CS256TCC", department: "ISE", semester: 5, electiveGroup: "C", defaultClassesPerWeek: 2 },
  { subjectName: "Embedded System Design with ARM", subjectCode: "IS256TCD", department: "ISE", semester: 5, electiveGroup: "C", defaultClassesPerWeek: 2 },
  { subjectName: "Introduction to Soft Computing", subjectCode: "IS256TCE", department: "ISE", semester: 5, electiveGroup: "C", defaultClassesPerWeek: 2 },

  // VI Sem: Core & Professional Core Electives (Group D, E)
  { subjectName: "Entrepreneurship and Intellectual Property Rights", subjectCode: "HS361TA", department: "ISE", semester: 6, defaultClassesPerWeek: 3 },
  { subjectName: "Cryptography & Network Security", subjectCode: "IS362IA", department: "ISE", semester: 6, defaultClassesPerWeek: 4 },
  { subjectName: "Compiler Design", subjectCode: "CS363IA", department: "ISE", semester: 6, defaultClassesPerWeek: 4 },
  { subjectName: "Software Engineering with Agile Technologies", subjectCode: "IS364TA", department: "ISE", semester: 6, defaultClassesPerWeek: 4 },
  { subjectName: "Interdisciplinary Project", subjectCode: "IS367P", department: "ISE", semester: 6, defaultClassesPerWeek: 3 },
  { subjectName: "Information Retrieval", subjectCode: "IS365TDA", department: "ISE", semester: 6, electiveGroup: "D", defaultClassesPerWeek: 3 },
  { subjectName: "Human Computer Interface", subjectCode: "IS365TDB", department: "ISE", semester: 6, electiveGroup: "D", defaultClassesPerWeek: 3 },
  { subjectName: "Web Frameworks", subjectCode: "CS365TDC", department: "ISE", semester: 6, electiveGroup: "D", defaultClassesPerWeek: 3 },
  { subjectName: "Generative Artificial Intelligence", subjectCode: "AI365TDD", department: "ISE", semester: 6, electiveGroup: "D", defaultClassesPerWeek: 3 },

  // VI Sem: Institutional Electives I (Group E)
  { subjectName: "Fundamentals of Aerospace Engineering", subjectCode: "AS266TEA", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Healthcare Analytics", subjectCode: "BT266TEB", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Industrial Safety Engineering", subjectCode: "CH266TEC", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Robotics Process Automation", subjectCode: "CS266TED", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Intelligent Transport Systems", subjectCode: "CV266TEE", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Integrated Health Monitoring of Structures", subjectCode: "CV266TEF", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Advanced Energy Storage for E-Mobility", subjectCode: "CM266TEG", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Human Machine Interface (HMI)", subjectCode: "EC266TEH", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Energy Auditing and Standards", subjectCode: "EE266TEJ", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Biomedical Instrumentation", subjectCode: "EI266TEK", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Telecommunication Systems", subjectCode: "ET266TEM", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Mobile Communication Networks and Standards", subjectCode: "ET266TEN", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Mobile Application Development", subjectCode: "IS266TEO", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Elements of Financial Management", subjectCode: "IM266TEQ", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Optimization Techniques", subjectCode: "IM266TER", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Automotive Mechatronics", subjectCode: "ME266TES", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Mathematical Modelling", subjectCode: "MA266TEU", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Mathematics of Quantum Computing", subjectCode: "MA266TEV", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Applied Psychology for Engineers", subjectCode: "HS266TEW", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
  { subjectName: "Universal Human Values", subjectCode: "HS266TEY", department: "ISE", semester: 6, electiveGroup: "E", defaultClassesPerWeek: 3 },
];

const faculty = [
  { name: "Dr. G S Mamatha", email: "mamathags@rvce.edu.in", department: "ISE" },
  { name: "Dr. B M Sagar", department: "ISE" },
  { name: "Dr. Ashwini K B", department: "ISE" },
  { name: "Dr. Vanishree K", email: "vanishreek@rvce.edu.in", department: "ISE" },
  { name: "Dr. Merin Meleet", email: "merinmeleet@rvce.edu.in", department: "ISE" },
  { name: "S G Raghavendra Prasad", email: "raghavendrap@rvce.edu.in", department: "ISE" },
  { name: "Rekha B S", email: "rekhabs@rvce.edu.in", department: "ISE" },
  { name: "Swetha S", email: "shwethas@rvce.edu.in", department: "ISE" },
  { name: "Srinivas B K", email: "bksrinivas@rvce.edu.in", department: "ISE" },
  { name: "Sushmitha N", email: "sushmithan@rvce.edu.in", department: "ISE" },
  { name: "Chethana R", email: "chethanar@rvce.edu.in", department: "ISE" },
  { name: "Dr. Kavitha S N", email: "kavithasna@rvce.edu.in", department: "ISE" },
  { name: "Rashmi R", email: "rashmir@rvce.edu.in", department: "ISE" },
  { name: "Dr. Anala M R", department: "ISE" },
  { name: "Dr. Padmashree T", email: "padmashreet@rvce.edu.in", department: "ISE" },
  { name: "Poornima Kulkarni", email: "poornimapk@rvce.edu.in", department: "ISE" },
  { name: "Prof. V. A. Girish", email: "girishva@rvce.edu.in", department: "MECH" },
];

async function seed() {
  console.log("Seeding ISE subjects...");
  const createdSubjects = [];
  for (const subject of subjects) {
    delete subject.year;
    delete subject.batchYear;
    try {
      createdSubjects.push(await request("/subjects", {
        method: "POST",
        body: JSON.stringify(subject),
      }));
    } catch (error) {
      if (!String(error.message).includes("409") && !String(error.message).includes("duplicate")) throw error;
    }
  }
  const allSubjects = await request("/subjects?department=ISE");
  const subjectByCode = new Map(allSubjects.map((subject) => [subject.subjectCode, subject]));

  console.log("Seeding ISE faculty...");
  const facultyByName = new Map();
  const existingFaculty = await request("/teachers");
  for (const member of existingFaculty) facultyByName.set(member.name, member);
  for (const member of faculty) {
    const existing = facultyByName.get(member.name);
    const payload = {
      ...member,
      subjectIds: existing?.subjects?.map((subject) => subject._id ?? subject) || [],
      maxClassesPerDay: 4,
      maxClassesPerWeek: 18,
      maxConsecutiveClasses: 2,
      availability: existing?.availability || [],
    };
    const created = existing
      ? await request(`/teachers/${existing._id}`, { method: "PUT", body: JSON.stringify(payload) })
      : await request("/teachers", { method: "POST", body: JSON.stringify(payload) });
    facultyByName.set(member.name, created);
  }

  console.log("Seeding ISE sections A and B...");
  await request("/sections", {
    method: "POST",
    body: JSON.stringify({ department: "ISE", year: 4, semester: 7, batchYear: 2027, sections: ["A", "B"] }),
  });
  await request("/sections", {
    method: "POST",
    body: JSON.stringify({ department: "ISE", year: 3, semester: 5, batchYear: 2028, sections: ["A", "B"] }),
  });

  const teacherSubjectAssignments = [
    ["Dr. G S Mamatha", ["IS374TFA", "IS376SI"]],
    ["Srinivas B K", ["IS374TFA"]],
    ["Sushmitha N", ["IS373TA"]],
    ["Poornima Kulkarni", ["IS373TA"]],
    ["Dr. Vanishree K", ["IS372IA"]],
    ["Chethana R", ["IS372IA", "IS355TBD"]],
    ["S G Raghavendra Prasad", ["HS271TA", "CS354TA"]],
    ["Swetha S", ["HS271TA"]],
    ["Rekha B S", ["HS251TA"]],
    ["Prof. V. A. Girish", ["HS251TA"]],
    ["Dr. Padmashree T", ["CD252IA"]],
    ["Rashmi R", ["CD252IA"]],
    ["Dr. Anala M R", ["CS354TA"]],
    ["Dr. Merin Meleet", ["IS353IA"]],
    ["Dr. Kavitha S N", ["CS355TBB"]],
  ];
  const teachersBeforeSubjectAssignments = await request("/teachers");
  const teacherByName = new Map(teachersBeforeSubjectAssignments.map((teacher) => [teacher.name, teacher]));
  for (const [teacherName, subjectCodes] of teacherSubjectAssignments) {
    const teacher = teacherByName.get(teacherName);
    if (!teacher) continue;
    const subjectIds = subjectCodes.map((code) => subjectByCode.get(code)?._id).filter(Boolean);
    await request(`/teachers/${teacher._id}`, {
      method: "PUT",
      body: JSON.stringify({ subjectIds }),
    });
  }

  const teachers = await request("/teachers");
  const sections = await request("/sections?department=ISE");
  console.log(`Seed complete: ${allSubjects.length} ISE subjects, ${teachers.length} faculty, ${sections.length} sections, and teacher-subject assignments. No teachers are assigned to sections.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
