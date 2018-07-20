We started with files that where available to the public via:
```
wget -r 198.82.18.138 &&\
```

and so on.   We made lots more edits, but that's where we started.

The static web server files must be in a directory named static
because flask sucks.  Other directory names will not work even
if you change the webServer code.

