from os import environ

if 'NAME' in environ and len(environ['NAME'].strip()) > 0:
    name = environ['NAME'].strip()
    print('Hello ' + name + '!')
else:
    print('Hello World!')
