import pandas as pd
import msoffcrypto
import sys
import os
import io

def convert_file(input_file, output_file):
    # 1️⃣ If CSV, just copy / load
    if input_file.lower().endswith(".csv"):
        df = pd.read_csv(input_file)
        df.to_csv(output_file, index=False)
        print(f"CSV copied: {output_file}")
        return

    # 2️⃣ Try reading as modern XLSX first
    try:
        df = pd.read_excel(input_file, engine="openpyxl")
        df.to_csv(output_file, index=False)
        print(f"Excel (.xlsx) read successfully: {output_file}")
        return
    except Exception:
        pass

    # 3️⃣ Try decrypting Excel
    try:
        with open(input_file, "rb") as f:
            office_file = msoffcrypto.OfficeFile(f)
            # Empty password (or put real password if needed)
            office_file.load_key(password=None)
            decrypted = io.BytesIO()
            office_file.decrypt(decrypted)
            decrypted.seek(0)
            df = pd.read_excel(decrypted, engine="openpyxl")
            df.to_csv(output_file, index=False)
            print(f"Encrypted Excel decrypted: {output_file}")
            return
    except Exception:
        pass

    # 4️⃣ Try old Excel (.xls) with xlrd
    try:
        df = pd.read_excel(input_file, engine="xlrd")
        df.to_csv(output_file, index=False)
        print(f"Old Excel (.xls) read successfully: {output_file}")
        return
    except Exception:
        pass

    # 5️⃣ If all fails, raise error
    raise ValueError(f"Cannot parse file: {input_file}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python convert_excel_to_csv.py input_file output_file")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    convert_file(input_path, output_path)






















# import pandas as pd
# import sys
# import msoffcrypto
# import io

# input_file = sys.argv[1]
# output_file = sys.argv[2]

# try:
#     df = pd.read_excel(input_file, engine="openpyxl")
# except Exception:
#     decrypted = io.BytesIO()

#     with open(input_file, "rb") as f:
#         office_file = msoffcrypto.OfficeFile(f)
#         office_file.load_key(password=None)
#         office_file.decrypt(decrypted)

#     decryted.seek(0)
#     df = pd.read_excel(decrypted, engine="openpyxl")

# df.to_csv(output_file, index=False)

# print("Conversion complete")