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
        "pitch": "Develop robot controls, integrate sensing and tooling, and bring our assembly prototype from the bench to repeatable operation.",
        "compensation": "$135,000–$165,000 USD per year + equity.",
        "pay_min": 135000,
        "pay_max": 165000,
        "pay_unit": "YEAR",
        "about": (
            "Our prototype needs to do more than insert a connector once. It needs to handle contact, physically test the joint and recover from a failed attempt. This role brings the mechanics, sensing and control software together to make that possible.",
            "As our first robotics hire, you’ll work directly with the founders on the system design and build. The work spans choosing components, designing fixtures, writing control software and testing the complete assembly sequence.",
        ),
        "responsibilities": (
            "Integrate the robot arm, gripper, cameras, force sensor and test equipment, including calibration and timing between devices.",
            "Develop motion and contact-control routines for connector alignment, insertion and recovery.",
            "Design gripper fingers, fixtures and part carriers; work with suppliers to fabricate and refine them.",
            "Build the sequence from a presented part to an assembled, tested joint, including what happens when a step fails.",
            "Use logs and physical measurements to diagnose failures. Track cycle time, damaged parts and the work needed from an operator.",
            "Work with safety specialists on guarding and interlocks, and with the learning engineer to run policies through the robot’s control interface.",
        ),
        "requirements": (
            "You’ve built or commissioned a robot, automation station or substantial mechatronic system, and can explain the decisions you made.",
            "You can write and debug C++ and Python on Linux, including code that communicates with physical devices.",
            "You understand coordinate frames, calibration, motion control and how a robot behaves during contact.",
            "You can work through mechanical, electrical and software faults, using measurements to separate the possible causes.",
        ),
        "bonus": (
            "Connector assembly, force-guided manipulation or factory commissioning.",
            "CAD and fixture design, industrial I/O, PLC integration or electrical test equipment.",
            "Robot SDKs, ROS 2 or running learned policies on hardware.",
        ),
        "milestone": "Commission one connector task with a physical acceptance test and a repeatable recovery sequence. Use those runs to establish the prototype’s limits and decide what to improve next.",
        "include": (
            "A video, repository, drawing set or write-up of a robot or machine you built. A description is welcome if the work is private.",
            "What you were responsible for, a difficult failure you investigated and how you found its cause.",
        ),
        "evidence_prompt": "Describe your contribution, a failure you investigated and how you found its cause. Include your availability.",
    },
    {
        "slug": "robot-learning-engineer",
        "title": "Robot Learning Engineer — Manipulation",
        "category": "Robotics · Learning",
        "employment_type": "FULL_TIME",
        "type_label": "Full-time",
        "tags": ("Full-time", "San Francisco, CA"),
        "home_meta": "Full-time · San Francisco, CA",
        "pitch": "Train assembly policies from demonstrations and robot trials, then measure their reliability in connector insertion, recovery and adaptation to new parts.",
        "compensation": "$150,000–$180,000 USD per year + equity.",
        "pay_min": 150000,
        "pay_max": 180000,
        "pay_unit": "YEAR",
        "about": (
            "We’re investigating how robots can learn assembly tasks from demonstrations, contact measurements and the results of physical tests. You’ll develop the policies and experiments that tell us where learning improves the prototype and what it takes to handle a different connector.",
            "You’ll work across data collection, training and robot deployment with the founders and controls engineer. The first task is connector insertion; success is judged by the tested joint, the recovery behavior and the amount of human intervention. We’ll agree the start date around the prototype’s build schedule.",
        ),
        "responsibilities": (
            "Build demonstration and intervention tools that record synchronized observations, actions and physical test results.",
            "Develop imitation-learning policies and investigate reinforcement learning where it can address observed failures.",
            "Deploy models on the prototype, accounting for calibration, inference latency and the robot’s control limits.",
            "Version datasets and checkpoints, and build tools to replay attempts and compare experiments.",
            "Evaluate policies against conventional control on separate test parts, including failed insertions, damage and manual recovery.",
            "Adapt the approach to a second connector and measure the additional demonstrations, tooling changes and engineering time required.",
        ),
        "requirements": (
            "You’ve trained a policy, run it on a physical robot and investigated cases where it failed.",
            "You can build training and evaluation code in Python using PyTorch or JAX.",
            "Practical experience with imitation learning or reinforcement learning, including how data collection affects the result.",
            "An understanding of robot observations, actions and timing, and the ability to debug the system around the model.",
            "Experience designing comparisons that separate a model improvement from a change in parts, fixtures or test conditions.",
        ),
        "bonus": (
            "Assembly or insertion tasks, action-chunking policies or learning from human corrections.",
            "Force or tactile sensing, LeRobot or SERL.",
            "C++, ROS 2, edge inference or adapting policies across parts and fixtures.",
        ),
        "milestone": "Establish a demonstration dataset and repeatable evaluation for the first connector. Train an initial policy, compare it with the programmed controller and use the recorded failures to choose the next experiment.",
        "include": (
            "A robot-learning project, with a video, code, paper or technical description showing your contribution.",
            "The data and method you used, how you tested the policy on hardware and a failure that changed your approach.",
        ),
        "evidence_prompt": "Describe the data, learning method and hardware evaluation. What failed, and what did you change? Include your availability.",
    },
    {
        "slug": "content-producer",
        "title": "Technical Content Producer",
        "category": "Marketing · Content",
        "employment_type": "CONTRACTOR",
        "type_label": "Contract",
        "tags": ("Contract", "San Francisco shoots", "Remote editing"),
        "home_meta": "Contract · San Francisco shoots · Remote editing",
        "pitch": "Document the engineering behind our prototype through video, photography and writing for customers, candidates and investors.",
        "compensation": "$1,500–$2,000 USD per month for an initial three-month contract. We’ll agree the work and number of revisions before starting.",
        "pay_min": 1500,
        "pay_max": 2000,
        "pay_unit": "MONTH",
        "about": (
            "Help people understand what we’re building and why the engineering matters. You’ll spend time with the founders, follow a robot experiment from setup to result and make work that is interesting to watch without overstating what the prototype can do.",
            "This is an initial three-month filming and editing contract. Shoots take place in San Francisco; editing can be remote. The founders review technical claims and handle publication.",
        ),
        "responsibilities": (
            "Plan one half-day shoot per month around an experiment or build milestone, including the shots and explanation needed to tell the story.",
            "Deliver two edited short videos each month, using shoot footage and clips recorded by the team between visits.",
            "Prepare captions, social exports, selected stills and four supporting posts or captions.",
            "Work with the founders to explain technical details and show the difference between a successful trial and a repeatable result.",
            "Maintain an organized footage library and editable project files so material can be reused for recruiting and company updates.",
        ),
        "requirements": (
            "A portfolio showing your camera work, editing and judgment about what makes a story worth watching.",
            "Ability to plan a shoot and handle lighting, sound, filming and editing for a small production.",
            "Clear writing and enough interest in the engineering to ask questions when something is unclear.",
            "Availability for scheduled shoots in San Francisco and comfort working around equipment and unfinished prototypes.",
        ),
        "bonus": (
            "Experience filming in a factory, lab or machine shop.",
            "Photography or motion graphics for robotics and hardware.",
            "Video work for LinkedIn, X, YouTube or Instagram.",
        ),
        "milestone": "Produce a short film following one prototype experiment: the assembly problem, how the test works and what the result tells us. Use it to establish the format and filming plan for the following month.",
        "include": (
            "Two pieces you made, with a note on the audience and your role in the filming, editing or writing.",
            "Your availability and a quote for the work described above.",
        ),
        "evidence_prompt": "Describe your contribution to the pieces you shared and how you’d approach a robot demonstration. Include availability and a quote for this scope.",
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
