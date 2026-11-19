$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:4000/api"
$department = "CSE"
$year = 1

$subjectDefinitions = @(
    @{ subjectName = "Data Structures"; subjectCode = "CSE101"; defaultClassesPerWeek = 4 }
    @{ subjectName = "Database Systems"; subjectCode = "CSE102"; defaultClassesPerWeek = 3 }
    @{ subjectName = "Operating Systems"; subjectCode = "CSE103"; defaultClassesPerWeek = 3 }
    @{ subjectName = "Computer Networks"; subjectCode = "CSE104"; defaultClassesPerWeek = 3 }
    @{ subjectName = "Discrete Mathematics"; subjectCode = "CSE105"; defaultClassesPerWeek = 3 }
    @{ subjectName = "Programming Laboratory"; subjectCode = "CSE106"; defaultClassesPerWeek = 2 }
)

$subjectByCode = @{}
$existingSubjects = Invoke-RestMethod "$baseUrl/subjects?department=$department"
foreach ($subject in $existingSubjects) {
    $subjectByCode[$subject.subjectCode] = $subject
}

foreach ($definition in $subjectDefinitions) {
    if (-not $subjectByCode[$definition.subjectCode]) {
        $body = @{
            subjectName = $definition.subjectName
            subjectCode = $definition.subjectCode
            department = $department
            defaultClassesPerWeek = $definition.defaultClassesPerWeek
        }
        $created = Invoke-RestMethod -Method Post -Uri "$baseUrl/subjects" -Body ($body | ConvertTo-Json) -ContentType "application/json"
        $subjectByCode[$definition.subjectCode] = $created
    }
}

$teacherDefinitions = @(
    @{ name = "Dr. Amit Sharma"; email = "amit.sharma@college.edu"; subjectCodes = @("CSE101", "CSE106") }
    @{ name = "Prof. Neha Gupta"; email = "neha.gupta@college.edu"; subjectCodes = @("CSE102") }
    @{ name = "Dr. Rahul Verma"; email = "rahul.verma@college.edu"; subjectCodes = @("CSE103") }
    @{ name = "Prof. Sneha Iyer"; email = "sneha.iyer@college.edu"; subjectCodes = @("CSE104") }
    @{ name = "Dr. Vikram Singh"; email = "vikram.singh@college.edu"; subjectCodes = @("CSE105") }
)

$teacherByName = @{}
$existingTeachers = Invoke-RestMethod "$baseUrl/teachers?department=$department"
foreach ($teacher in $existingTeachers) {
    $teacherByName[$teacher.name] = $teacher
}

foreach ($definition in $teacherDefinitions) {
    if (-not $teacherByName[$definition.name]) {
        $subjectIds = @($definition.subjectCodes | ForEach-Object { $subjectByCode[$_]._id })
        $body = @{
            name = $definition.name
            email = $definition.email
            department = $department
            subjectIds = $subjectIds
        }
        $created = Invoke-RestMethod -Method Post -Uri "$baseUrl/teachers" -Body ($body | ConvertTo-Json -Depth 5) -ContentType "application/json"
        $teacherByName[$definition.name] = $created
    }
}

$sectionBody = @{
    department = $department
    year = $year
    sections = @("A", "B")
}
$sections = Invoke-RestMethod -Method Post -Uri "$baseUrl/sections" -Body ($sectionBody | ConvertTo-Json -Depth 5) -ContentType "application/json"

$assignments = @(
    @{ subjectCode = "CSE101"; classesPerWeek = 4; teacherName = "Dr. Amit Sharma" }
    @{ subjectCode = "CSE102"; classesPerWeek = 3; teacherName = "Prof. Neha Gupta" }
    @{ subjectCode = "CSE103"; classesPerWeek = 3; teacherName = "Dr. Rahul Verma" }
    @{ subjectCode = "CSE104"; classesPerWeek = 3; teacherName = "Prof. Sneha Iyer" }
    @{ subjectCode = "CSE105"; classesPerWeek = 3; teacherName = "Dr. Vikram Singh" }
    @{ subjectCode = "CSE106"; classesPerWeek = 2; teacherName = "Dr. Amit Sharma" }
)

foreach ($section in $sections) {
    $subjectRows = @()
    foreach ($assignment in $assignments) {
        $subjectRows += @{
            subjectId = $subjectByCode[$assignment.subjectCode]._id
            classesPerWeek = $assignment.classesPerWeek
            teacherId = $teacherByName[$assignment.teacherName]._id
        }
    }
    $body = @{
        subjects = $subjectRows
        holidays = @("Sunday")
    }
    Invoke-RestMethod -Method Post -Uri "$baseUrl/sections/$($section._id)/subjects" -Body ($body | ConvertTo-Json -Depth 8) -ContentType "application/json" | Out-Null
}

$routineSections = @()
foreach ($section in (Invoke-RestMethod "$baseUrl/sections?department=$department&year=$year")) {
    $routineSubjectRows = @()
    foreach ($assignment in $assignments) {
        $subject = $subjectByCode[$assignment.subjectCode]
        $teacher = $teacherByName[$assignment.teacherName]
        $routineSubjectRows += @{
            subjectId = $subject._id
            subjectName = $subject.subjectName
            subjectCode = $subject.subjectCode
            teacherId = $teacher._id
            teacherName = $teacher.name
            classesPerWeek = $assignment.classesPerWeek
        }
    }
    $routineSections += @{
        name = $section.name
        holidays = @("Sunday")
        subjects = $routineSubjectRows
    }
}

$routineBody = @{
    department = $department
    year = $year
    periodsPerDay = 6
    sections = $routineSections
}
$routine = Invoke-RestMethod -Method Post -Uri "$baseUrl/routines" -Body ($routineBody | ConvertTo-Json -Depth 12) -ContentType "application/json"

$subjectCount = (Invoke-RestMethod "$baseUrl/subjects?department=$department").Count
$teacherCount = (Invoke-RestMethod "$baseUrl/teachers?department=$department").Count
$sectionCount = (Invoke-RestMethod "$baseUrl/sections?department=$department&year=$year").Count

Write-Host "Seed complete"
Write-Host "Subjects: $subjectCount"
Write-Host "Teachers: $teacherCount"
Write-Host "Sections: $sectionCount"
Write-Host "Unsatisfied classes: $($routine.unsatisfied.Count)"
