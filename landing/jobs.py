from datetime import date

from django.urls import reverse


JOBS_UPDATED = date(2026, 9, 20)
JOBS = (
    {
        "slug": "founding-robotics-engineer",
        "title": "Founding Robotics Engineer — Controls & Integration",
        "category": "Robotics · Controls",
        "employment_type": "FULL_TIME",
        "type_label": "Full-time",
        "tags": ("Full-time", "On-site", "San Francisco, CA"),
        "home_meta": "Full-time · San Francisco, CA",
        "pitch": "Build A1’s robot, tooling, sensing and controls into a complete connector-assembly process.",
        "compensation": "$135,000–$165,000 USD annual base salary + equity. The offer reflects relevant skills, experience and responsibilities; equity terms are specified separately in the offer and approved grant documents.",
        "pay_min": 135000,
        "pay_max": 165000,
        "pay_unit": "YEAR",
        "about": (
            "Own the engineering that turns a connector on a bench into a complete robotic operation. Make the arm move well, make the fixture and test equipment tell us what happened, and make the process recover when an attempt fails.",
            "You’ll work directly with the founders, from design and supplier work through commissioning and measured trials. This is our first engineering hiring priority.",
        ),
        "responsibilities": (
            "Integrate the robot, gripper, cameras, force sensing and test equipment into one working process.",
            "Develop contact-control routines and a conventional insertion baseline before comparing learned behavior.",
            "Design and iterate simple fingers, fixtures and part carriers; coordinate fabrication and specialist support.",
            "Build the assembly, physical verification, routing and next-ready states, with clear recovery procedures.",
            "Diagnose mechanical, electrical, timing and software failures using measurements and recorded runs.",
            "Work with qualified specialists on guarding, interlocks and application safety.",
            "Track accepted output, damaged parts, interventions and the time spent preparing and recovering trials.",
        ),
        "requirements": (
            "You have commissioned a physical robot, automation station or complex mechatronic system and can explain your contribution.",
            "You can build and debug control and integration software in C++ and Python on Linux.",
            "You understand coordinate frames, calibration, motion, compliance and the practical behavior of contact tasks.",
            "You are comfortable with sensors, wiring, tooling and mechanical drawings, and know when a specialist is needed.",
            "You can investigate a failure systematically and turn the result into a repeatable procedure.",
        ),
        "bonus": (
            "Connector or small-part assembly, force-guided manipulation, or factory commissioning.",
            "CAD and fixture design, industrial I/O, PLC integration or electrical test equipment.",
            "Commercial robot SDKs, ROS 2 or integrating learned policies with a physical controller.",
        ),
        "milestone": "Characterize the first connector task, establish a trustworthy physical test and commission a single-carrier assembly cycle. Then make repeated attempts possible with controlled recovery and a clear next-ready state.",
        "include": (
            "A physical system you helped make work: a video, repository, drawing set, technical write-up or nonconfidential description.",
            "What you owned and one failure you traced to its actual cause.",
        ),
        "evidence_prompt": "What did you own on the physical system, and how did you diagnose a difficult failure? Include on-site availability and your earliest start.",
    },
    {
        "slug": "robot-learning-engineer",
        "title": "Robot Learning Engineer — Manipulation",
        "category": "Robotics · Learning",
        "employment_type": "FULL_TIME",
        "type_label": "Full-time",
        "tags": ("Full-time", "On-site", "San Francisco, CA"),
        "home_meta": "Full-time · San Francisco, CA",
        "pitch": "Train and test assembly policies on real parts, with measured outcomes and a clear conventional baseline.",
        "compensation": "$150,000–$180,000 USD annual base salary + equity. The offer reflects relevant skills, experience and responsibilities; equity terms are specified separately in the offer and approved grant documents.",
        "pay_min": 150000,
        "pay_max": 180000,
        "pay_unit": "YEAR",
        "about": (
            "Own the learning experiments on A1, from a recorded robot attempt to a policy we can evaluate and release. Find where learning improves the operation and how much work it saves when the part changes.",
            "You’ll work with the founders and controls engineer, including on the data and evaluation tools each experiment needs. We’re recruiting in sequence; the start date will be agreed around the cell’s build schedule.",
        ),
        "responsibilities": (
            "Collect demonstrations and interventions with synchronized observations, actions and independently measured outcomes.",
            "Build small, reproducible imitation-learning and reinforcement-learning experiments for contact-rich assembly.",
            "Deploy policies through the cell’s control interface and investigate perception, timing and contact failures.",
            "Connect dataset versions, experiment records and checkpoints to the physical parts and software used.",
            "Compare candidate policies with a competent conventional controller on separate, fresh evaluation parts.",
            "Measure interventions, material use and the work needed to qualify a related connector variant.",
            "Keep development policies and qualified releases distinct, with reproducible evaluation before release.",
        ),
        "requirements": (
            "You have trained a policy and evaluated it on a physical robot, and can discuss useful results and failure cases.",
            "Strong Python and practical experience with PyTorch or JAX.",
            "Working knowledge of imitation learning or reinforcement learning, and the judgment to choose a simpler method when appropriate.",
            "Comfort with robot observations, actions, calibration, latency and real-world debugging.",
            "Experience building tools that make training and evaluation reproducible.",
        ),
        "bonus": (
            "Assembly or insertion tasks, action-chunking policies, or human corrections.",
            "Force or tactile inputs, LeRobot or SERL-style workflows.",
            "C++, ROS 2, edge inference or adapting policies across parts and fixtures.",
        ),
        "milestone": "Audit the observations and outcome labels, establish a repeatable training and evaluation path, and run a bounded policy comparison. Use the failures to choose the next experiment and document the cost of improving a second variant.",
        "include": (
            "One physical robot-learning project: what you trained, the data you collected and how you evaluated it.",
            "Your contribution and one result that made you change your approach. A nonconfidential explanation is welcome.",
        ),
        "evidence_prompt": "What policy did you train, how did you evaluate it on hardware, and what failure changed your approach? Include on-site availability and your earliest start.",
    },
    {
        "slug": "content-producer",
        "title": "Technical Content Producer",
        "category": "Marketing · Content",
        "employment_type": "CONTRACTOR",
        "type_label": "Contract",
        "tags": ("Contract", "San Francisco shoots", "Remote editing"),
        "home_meta": "Contract · San Francisco shoots · Remote editing",
        "pitch": "Turn measured bench progress into clear videos and stories for the people following Defex.",
        "compensation": "$1,500–$2,000 USD per month for an initial three-month project. We’ll agree deliverables and revision allowances before each production cycle.",
        "pay_min": 1500,
        "pay_max": 2000,
        "pay_unit": "MONTH",
        "about": (
            "Help people understand what happened at the bench: what we tested, what failed and what changed. Spend time with the founders and turn a specific engineering result into an understandable short story.",
            "This is a scoped filming and editing project. Shoots take place in San Francisco; editing can be remote. The founders review technical claims and handle publication.",
        ),
        "responsibilities": (
            "Plan and film one half-day shoot per month, supported by footage captured by the team between shoots.",
            "Deliver two edited short videos per month, with captions and suitable social exports.",
            "Write four supporting posts or captions and select stills from the month’s work.",
            "Keep footage and project files organized so the next edit can build on previous work.",
            "Distinguish measured results, failed attempts and future goals in every piece.",
        ),
        "requirements": (
            "Work you personally planned, shot or edited, with a clear account of your contribution.",
            "The ability to film, edit and write about a technical subject accurately.",
            "Comfort around hardware, tools and engineers working through unfinished problems.",
            "Availability for planned shoots in San Francisco and a reliable editing workflow.",
        ),
        "bonus": (
            "Experience filming in a factory, lab or machine shop.",
            "Technical storytelling, photography or motion graphics for robotics and hardware.",
            "Experience adapting a story for LinkedIn, X, YouTube or Instagram.",
        ),
        "milestone": "Plan the first shoot around a defined experiment and deliver a short video that makes its setup, result and limitation clear. Establish a repeatable production process for the next two months.",
        "include": (
            "Two pieces you personally shot or edited and what you owned on each.",
            "How you would film a robot experiment, your availability and a quote for the initial scope.",
        ),
        "evidence_prompt": "What did you personally shoot or edit? Describe how you would film a robot experiment, your availability and a quote for the initial scope.",
    },
)

JOB_BY_SLUG = {job["slug"]: job for job in JOBS}
ROLE_CHOICES = tuple((job["slug"], job["title"]) for job in JOBS)


def job_path(job):
    return reverse("career_detail", kwargs={"slug": job["slug"]})


def job_groups(jobs=JOBS):
    groups = []
    for title, group_id, kind, meta in (
        ("Full-time", "fulltime-title", "FULL_TIME", "San Francisco, CA · On-site"),
        ("Contract", "contract-title", "CONTRACTOR", "San Francisco shoots · Remote editing"),
    ):
        members = [job for job in jobs if job["employment_type"] == kind]
        if members:
            groups.append({"title": title, "id": group_id, "jobs": members, "meta": meta})
    return groups
