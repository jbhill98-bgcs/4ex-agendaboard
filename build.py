import os
import os
R=os.path.dirname(os.path.abspath(__file__))+'/'
css=open(R+'src/styles.css').read()
qr=open(R+'vendor/qrcode.js').read()
js='\n'.join(open(R+'src/'+f).read() for f in ['core.js','widgets1.js','widgets2.js'])
icon=open(R+'icon.b64').read()
html=f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Class Board">
<meta name="theme-color" content="#0B1F3A">
<link rel="apple-touch-icon" href="data:image/png;base64,{icon}">
<link rel="icon" href="data:image/png;base64,{icon}">
<title>4 Example Classroom Board</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
{css}
</style>
</head>
<body>
<script>
/* qrcode-generator 1.4.4 (c) Kazuhiko Arase, MIT License */
{qr}
</script>
<script>
{js}
boot();
</script>
</body>
</html>
'''

open(R+'index.html','w').write(html)
print(len(html))
