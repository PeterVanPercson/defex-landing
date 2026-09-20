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
        "tags": ("Full-time", "San Francisco, CA"),
        "home_meta": "Full-time · San Francisco, CA",
        "pitch": "Build the hardware and controls for our first connector-assembly cell.",
        "compensation": "$135,000–$165,000 USD per year + equity.",
        "pay_min": 135000,
        "pay_max": 165000,
        "pay_unit": "YEAR",
        "about": (
            "Help us get the first Defex cell working. You’ll choose and integrate tooling, write control software and test it on real connectors.",
            "You’ll work directly with the founders, from the first fixtures through repeated assembly runs.",
        ),
        "responsibilities": (
            "Connect the arm, gripper, cameras, force sensor and test equipment.",
            "Write and tune motion and force-control code.",
            "Design gripper fingers and fixtures, and work with suppliers to make them.",
            "Build insertion, testing and recovery routines.",
            "Debug failed runs and track cycle time, damaged parts and manual interventions.",
            "Work with safety specialists on guarding and interlocks.",
        ),
        "requirements": (
            "Experience commissioning a robot or automation system.",
            "C++ and Python on Linux.",
            "A working understanding of calibration, coordinate frames and contact control.",
            "Ability to debug mechanical, electrical and software problems at the bench.",
        ),
        "bonus": (
            "Connector assembly, force-guided manipulation or factory commissioning.",
            "CAD and fixture design, industrial I/O, PLC integration or electrical test equipment.",
            "Robot SDKs, ROS 2 or running learned policies on hardware.",
        ),
        "milestone": "Get one connector assembled, physically tested and cleared for the next attempt. Then make the cycle repeat reliably.",
        "include": (
            "A robot or machine you worked on. Send a video, code, drawings or a short description you can share.",
            "Your part in the project and a difficult problem you solved.",
        ),
        "evidence_prompt": "What did you build, and what was a difficult problem you solved? When could you start?",
    },
    {
        "slug": "robot-learning-engineer",
        "title": "Robot Learning Engineer — Manipulation",
        "category": "Robotics · Learning",
        "employment_type": "FULL_TIME",
        "type_label": "Full-time",
        "tags": ("Full-time", "San Francisco, CA"),
        "home_meta": "Full-time · San Francisco, CA",
        "pitch": "Train robots to assemble connectors and test what works on hardware.",
        "compensation": "$150,000–$180,000 USD per year + equity.",
        "pay_min": 150000,
        "pay_max": 180000,
        "pay_unit": "YEAR",
        "about": (
            "Build and test assembly policies for the first Defex cell. Collect demonstrations, train models and run experiments on the robot.",
            "You’ll work with the founders and controls engineer. The start date depends on when the cell is ready for training.",
        ),
        "responsibilities": (
            "Collect demonstrations and record observations, actions and physical test results.",
            "Train assembly policies using imitation learning or reinforcement learning.",
            "Run policies on the robot and debug perception, timing and contact failures.",
            "Keep datasets, checkpoints and experiment records reproducible.",
            "Compare learned policies with conventional control on fresh test parts.",
            "Track failures, manual interventions and the work needed to adapt to a new connector.",
            "Test policies before using them in production, and keep experimental versions separate.",
        ),
        "requirements": (
            "Experience training and testing a policy on a physical robot.",
            "Python and PyTorch or JAX.",
            "Practical experience with imitation learning or reinforcement learning.",
            "Ability to debug robot data, calibration and latency problems.",
            "Experience running reproducible training and evaluation experiments.",
        ),
        "bonus": (
            "Assembly or insertion tasks, action-chunking policies or learning from human corrections.",
            "Force or tactile sensing, LeRobot or SERL.",
            "C++, ROS 2, edge inference or adapting policies across parts and fixtures.",
        ),
        "milestone": "Collect the first demonstrations, train a policy and compare it with conventional control. Then test how much work it takes to adapt to a second connector.",
        "include": (
            "A robot-learning project: what you trained and how you tested it on hardware.",
            "Your part in the project and a result that changed your approach. A description is fine if the code is private.",
        ),
        "evidence_prompt": "What did you train, how did you test it on a robot, and what didn’t work? When could you start?",
    },
    {
        "slug": "content-producer",
        "title": "Technical Content Producer",
        "category": "Marketing · Content",
        "employment_type": "CONTRACTOR",
        "type_label": "Contract",
        "tags": ("Contract", "San Francisco shoots", "Remote editing"),
        "home_meta": "Contract · San Francisco shoots · Remote editing",
        "pitch": "Film the robots, the tests and the work behind them.",
        "compensation": "$1,500–$2,000 USD per month for an initial three-month contract. We’ll agree the work and number of revisions before starting.",
        "pay_min": 1500,
        "pay_max": 2000,
        "pay_unit": "MONTH",
        "about": (
            "Work with the founders to film experiments and explain what happened. Show the attempts, the failures and what changed between them.",
            "Shoots are in San Francisco; editing can be remote. The founders check technical details and publish the finished work.",
        ),
        "responsibilities": (
            "Plan and film one half-day shoot per month. The team will also record footage between shoots.",
            "Edit two short videos per month, with captions and exports for social media.",
            "Write four posts or captions and select stills from the footage.",
            "Keep footage and project files organized.",
            "Show what the robot actually did and make clear what is still being built.",
        ),
        "requirements": (
            "Examples of work you shot or edited.",
            "Ability to film, edit and write clearly about technical work.",
            "Comfort filming around hardware and tools.",
            "Availability for shoots in San Francisco.",
        ),
        "bonus": (
            "Experience filming in a factory, lab or machine shop.",
            "Photography or motion graphics for robotics and hardware.",
            "Video work for LinkedIn, X, YouTube or Instagram.",
        ),
        "milestone": "Film one robot experiment and edit a short video explaining the setup, the result and what still needs work.",
        "include": (
            "Two pieces you shot or edited, with a note about your part in each.",
            "Your availability and a quote for the work described above.",
        ),
        "evidence_prompt": "What did you shoot or edit? Include your availability and a quote for the work described above.",
    },
)

JOB_BY_SLUG = {job["slug"]: job for job in JOBS}
ROLE_CHOICES = tuple((job["slug"], job["title"]) for job in JOBS)


def job_path(job):
    return reverse("career_detail", kwargs={"slug": job["slug"]})


def job_groups(jobs=JOBS):
    groups = []
    for title, group_id, kind, meta in (
        ("Full-time", "fulltime-title", "FULL_TIME", "San Francisco, CA"),
        ("Contract", "contract-title", "CONTRACTOR", "San Francisco shoots · Remote editing"),
    ):
        members = [job for job in jobs if job["employment_type"] == kind]
        if members:
            groups.append({"title": title, "id": group_id, "jobs": members, "meta": meta})
    return groups
