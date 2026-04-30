# 条件判断
# if / elif / else 控制程序流程

score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"

print(f"分数: {score}, 等级: {grade}")

# 嵌套条件
age = 20
has_id = True

if age >= 18:
    if has_id:
        print("可以进入")
    else:
        print("请出示证件")
else:
    print("未成年，不可进入")
