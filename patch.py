import re

file_path = r'c:\Users\anves\OneDrive\Desktop\private-lending-system\app\payments\new\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_top = \"\"\"          <form onSubmit={handleSubmit} className=\"space-y-8\">
            <div className=\"grid gap-8 lg:grid-cols-3\">
              
              {/* Left Column - Form Steps */}
              <div className=\"lg:col-span-2 space-y-8\">\"\"\"

new_top = \"\"\"          <form onSubmit={handleSubmit} className=\"space-y-8\">\"\"\"

content = content.replace(old_top, new_top)

old_step3 = \"\"\"                {/* Step 3: Payment Details */}\"\"\"
new_step3 = \"\"\"            <div className=\"grid gap-8 lg:grid-cols-3\">
              <div className=\"lg:col-span-2 space-y-8\">
                {/* Step 3: Payment Details */}\"\"\"

content = content.replace(old_step3, new_step3)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
