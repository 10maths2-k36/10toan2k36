import os
import re

def remove_comments_from_content(content, file_extension):
    """Hàm loại bỏ chú thích tùy thuộc vào phần mở rộng của file."""
    if file_extension in ['.html', '.htm']:
        # Xóa comment HTML: <!-- ... -->
        content = re.sub(r'<!--[\s\S]*?-->', '', content)
        # Xóa comment JS/CSS nằm trong thẻ <script> hoặc <style>
        content = re.sub(r'/\*[\s\S]*?\*/', '', content)
        content = re.sub(r'(?<![:/])//.*', '', content)
    elif file_extension in ['.js', '.css', '.scss']:
        # Xóa comment dạng block: /* ... */
        content = re.sub(r'/\*[\s\S]*?\*/', '', content)
        # Xóa comment dạng dòng: // (tránh bắt nhầm các URL kiểu http://)
        content = re.sub(r'(?<![:/])//.*', '', content)
    
    # Dọn dẹp và đôn các dòng trống thừa ra sau khi xóa comment
    lines = content.splitlines()
    cleaned_lines = [line for line in lines if line.strip() != '']
    
    return '\n'.join(cleaned_lines)

def clean_project():
    print("=== TOOL XÓA TRIỆT ĐỂ MỌI CHÚ THÍCH ===")
    root_dir = input("Nhập đường dẫn thư mục dự án (Nhấn Enter luôn nếu để chung thư mục): ").strip()
    
    if not root_dir:
        root_dir = os.getcwd()
        
    if not os.path.exists(root_dir):
        print("❌ Thư mục không tồn tại!")
        return

    print(f"Đang xử lý thư mục: {root_dir}...\n")
    
    count = 0
    # Các định dạng file cần quét
    valid_extensions = ('.html', '.htm', '.js', '.css')
    
    # Các thư mục cần bỏ qua không quét (như .git, node_modules)
    ignored_dirs = ('.git', 'node_modules', '.vscode')

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Loại bỏ các thư mục không muốn quét
        dirnames[:] = [d for d in dirnames if d not in ignored_dirs]
        
        for filename in filenames:
            if filename.endswith(valid_extensions):
                file_path = os.path.join(dirpath, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    ext = os.path.splitext(filename)[1].lower()
                    new_content = remove_comments_from_content(content, ext)
                    
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                        
                    print(f"Đã làm sạch: {os.path.relpath(file_path, root_dir)}")
                    count += 1
                except Exception as e:
                    print(f"⚠️ Lỗi khi xử lý file {filename}: {e}")

    print(f"\nHoàn tất! Đã quét và làm sạch tổng cộng {count} file.")

if __name__ == "__main__":
    clean_project()