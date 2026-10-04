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
        "pitch": "Get our robot plugging in connectors every time, not just once.",
        "compensation": "$135,000–$165,000 USD per year + equity.",
        "pay_min": 135000,
        "pay_max": 165000,
        "pay_unit": "YEAR",
        "about": (
            "Plugging a connector in once is easy. Doing it every time, testing it and recovering when it fails is the job.",
            "You’re our first robotics hire. You’ll work with the founders on all of it: parts, fixtures, control code and testing.",
        ),
        "responsibilities": (
            "Hook up the arm, gripper, cameras, force sensor and test gear. Calibrate them and keep them in sync.",
            "Write the motion and contact control for lining up, pushing in and recovering.",
            "Design fingers, fixtures and part carriers, and get them made.",
            "Build the full run: part in, joint made, joint tested, and what happens when a step fails.",
            "Find out why things fail, from logs and measurements. Track cycle time, broken parts and how often a person steps in.",
            "Work with safety on guarding and interlocks, and with the learning engineer to run policies on the robot.",
        ),
        "requirements": (
            "You’ve built or commissioned a robot or automation station and can explain your choices.",
            "C++ and Python on Linux, including code that talks to hardware.",
            "Coordinate frames, calibration, motion control, and how a robot behaves when it touches things.",
            "You can chase a fault through mechanical, electrical and software, with measurements.",
        ),
        "bonus": (
            "Connector work, force-guided manipulation or factory commissioning.",
            "CAD and fixture design, industrial I/O, PLC integration or electrical test equipment.",
            "Robot SDKs, ROS 2 or running learned policies on hardware.",
        ),
        "milestone": "Get one connector task running with a real pass/fail test and a recovery that works the same way each time. Then pick what to fix next.",
        "include": (
            "A video, repo, drawings or write-up of a machine you built. If it’s private, describe it.",
            "What you did, one hard failure, and how you found the cause.",
        ),
        "evidence_prompt": "What did you build, what broke, and how did you find out why? When can you start?",
    },
    {
        "slug": "robot-learning-engineer",
        "title": "Robot Learning Engineer — Manipulation",
        "category": "Robotics · Learning",
        "employment_type": "FULL_TIME",
        "type_label": "Full-time",
        "tags": ("Full-time", "San Francisco, CA"),
        "home_meta": "Full-time · San Francisco, CA",
        "pitch": "Teach the robot connector work from demonstrations and its own tries, and measure how well it holds up.",
        "compensation": "$150,000–$180,000 USD per year + equity.",
        "pay_min": 150000,
        "pay_max": 180000,
        "pay_unit": "YEAR",
        "about": (
            "We want the robot to learn connector work from demonstrations, touch and its own test results. You’ll find out where learning helps and what it takes to switch to a new connector.",
            "You’ll own data, training and running models on the robot, with the founders and the controls engineer. A result counts when the joint passes its test, the robot recovers on its own and no one has to step in. Start date follows the prototype build.",
        ),
        "responsibilities": (
            "Build tools that record demonstrations and corrections, in sync with what the robot did and whether the part passed.",
            "Train imitation-learning policies. Try reinforcement learning where it fixes a real failure.",
            "Run models on the robot within its calibration, latency and control limits.",
            "Version data and checkpoints. Build tools to replay attempts and compare runs.",
            "Test policies against hand-written control on fresh parts: misses, damage, manual fixes.",
            "Move to a second connector and count what it took: demos, tooling and engineering time.",
        ),
        "requirements": (
            "You’ve trained a policy, run it on a real robot and dug into why it failed.",
            "Training and evaluation code in Python, with PyTorch or JAX.",
            "Hands-on imitation or reinforcement learning, and how the data you collect shapes the result.",
            "You know robot observations, actions and timing, and can debug everything around the model.",
            "You can set up a test that tells a better model apart from a change in parts or fixtures.",
        ),
        "bonus": (
            "Insertion tasks, action-chunking policies or learning from human corrections.",
            "Force or tactile sensing, LeRobot or SERL.",
            "C++, ROS 2, edge inference or adapting policies across parts and fixtures.",
        ),
        "milestone": "Collect demonstrations and build a repeatable test for the first connector. Train a first policy, compare it with the programmed controller, and let its failures pick the next experiment.",
        "include": (
            "A robot-learning project: video, code, paper or write-up, with your part made clear.",
            "Your data and method, how you tested on hardware, and a failure that changed your approach.",
        ),
        "evidence_prompt": "What data and method did you use, how did you test on hardware, and what failed? When can you start?",
    },
    {
        "slug": "content-producer",
        "title": "Technical Content Producer",
        "category": "Marketing · Content",
        "employment_type": "CONTRACTOR",
        "type_label": "Contract",
        "tags": ("Contract", "San Francisco shoots", "Remote editing"),
        "home_meta": "Contract · San Francisco shoots · Remote editing",
        "pitch": "Film and edit what we build: short videos, photos and posts about the robot.",
        "compensation": "$1,500–$2,000 USD a month, three months to start. We agree the scope and revisions up front.",
        "pay_min": 1500,
        "pay_max": 2000,
        "pay_unit": "MONTH",
        "about": (
            "Show people what we’re building. You’ll follow a robot test from setup to result and make it worth watching, without overselling it.",
            "Three-month contract. Shoots in San Francisco, editing from anywhere. The founders check the technical claims and publish.",
        ),
        "responsibilities": (
            "Plan and shoot one half-day a month around a test or a build.",
            "Deliver two short edited videos a month, from your footage and clips the team records.",
            "Captions, social cuts, a few stills and four short posts.",
            "Show the difference between a lucky try and a result that holds up.",
            "Keep footage and project files organized so we can reuse them.",
        ),
        "requirements": (
            "A portfolio of your own shooting and editing.",
            "You can light, record sound, film and edit a small shoot on your own.",
            "Clear writing, and you ask when you don’t understand the engineering.",
            "Free for shoots in San Francisco, and fine working around half-built machines.",
        ),
        "bonus": (
            "Experience filming in a factory, lab or machine shop.",
            "Photography or motion graphics for robotics and hardware.",
            "Video work for LinkedIn, X, YouTube or Instagram.",
        ),
        "milestone": "One short film of one test: the problem, how we check the part, and what the result means. It sets the format for the next month.",
        "include": (
            "Two pieces you made, and what you did on each.",
            "Your availability and a quote for this work.",
        ),
        "evidence_prompt": "What did you do on the pieces you shared, and how would you film a robot test? Include availability and a quote.",
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
