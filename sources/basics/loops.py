# 循环
# for 循环和 while 循环

# for 循环遍历列表
fruits = ["苹果", "香蕉", "橘子"]
for fruit in fruits:
    print(f"我喜欢{fruit}")

# range 循环
total = 0
for i in range(1, 6):
    total += i
print(f"1到5的和: {total}")

# while 循环
count = 5
while count > 0:
    print(f"倒计时: {count}")
    count -= 1

# break 和 continue
for num in range(10):
    if num == 3:
        continue  # 跳过3
    if num == 7:
        break     # 遇到7停止
    print(num)
