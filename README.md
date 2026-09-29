# The Last Dzong Keeper

our group project for the programming course. a detective game set in a dzong during the tshechu festival.
you walk around the rooms, talk to witnesses and try to find the intruder before time runs out.

## how to run

the frontend is in `web/`. just serve that folder, for example:

    cd web
    python3 -m http.server 8000

then open http://localhost:8000

## whats done

- [x] map
- [x] sound
- [x] fake backend (`web/js/mock/`) so we can test without the java part
- [ ] connect to the real java backend
- [ ] patrol thing in the ui
- [ ] mobile layout is kinda broken
