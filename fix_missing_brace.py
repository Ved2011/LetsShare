import os

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('sidebar.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            # We need to add an extra '}' before '// Toggle logic'
            # Let's replace "        }\n\n    // Toggle logic" with "        }\n    }\n\n    // Toggle logic"
            # Since formatting might vary, let's use a more robust replacement.
            
            target = """            }
        }

    // Toggle logic"""
            
            replacement = """            }
        }
    }

    // Toggle logic"""
            
            # Wait, my sidebar_replacement_script ended exactly like this:
            #             }
            #         }
            # """
            # followed by "\n    " + content[end_idx:] which starts with "// Toggle logic"
            # So the file currently has:
            #             }
            #         }
            #     // Toggle logic
            
            if "        }\n    // Toggle logic" in content:
                content = content.replace("        }\n    // Toggle logic", "        }\n    }\n    // Toggle logic")
            elif "        }\n\n    // Toggle logic" in content:
                 content = content.replace("        }\n\n    // Toggle logic", "        }\n    }\n\n    // Toggle logic")
            elif "} // Toggle logic" in content: # just in case
                 content = content.replace("} // Toggle logic", "}\n    } // Toggle logic")
            else:
                 # fallback regex
                 import re
                 content = re.sub(r'}\s*// Toggle logic', '}\n    }\n\n    // Toggle logic', content)
                 
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"Fixed missing brace in {filepath}")

