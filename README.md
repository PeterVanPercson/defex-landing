# Defex Robotics

Self-teaching robots for manufacturing, starting with connector assembly.

[Website](https://defexrobotics.com/) · [Company](https://defexrobotics.com/company/) · [Engineering notes](https://defexrobotics.com/blog/)

Defex is developing assembly robots around a physical learning loop: attempt an assembly, test the connection, and reset for the next try. The aim is less setup effort for the next supported part variant.

As of September 17, 2026, 21 factories are on the paid waitlist before the first assembly cell ships. The visual-inspection prototype is built; the assembly cell is in development. Waitlist participation is not a deployed robot count.

Founded by twin brothers Husan Mavlonov (CEO) and Hasan Mavlonov (CTO), building in San Francisco.

## Public information

- [Company facts](https://defexrobotics.com/company/) and the matching [JSON export](https://defexrobotics.com/company.json)
- [The Cost of the Next Attempt](https://defexrobotics.com/blog/the-cost-of-the-next-attempt/)
- [Inspection prototype](https://defexrobotics.com/#origin)
- [Engineering RSS feed](https://defexrobotics.com/blog/feed.xml)
- Contact: husan@defexrobotics.com

## This repository

The Django website, not the robot-control software. Public availability of this repository does not grant a license to proprietary hardware, customer data, or model assets.

```sh
pip install -r requirements.txt
python manage.py check
python manage.py test
python manage.py runserver
```

Public company data lives in `landing/discovery.py`. Update the dated snapshot there when facts change. Do not add confidential fundraising discussions, private decks, customer records, access tokens, or unsupported performance claims.
