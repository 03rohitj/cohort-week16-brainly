export function random(length: number){
    const option = "qwertyuioplkjhgfdsazxcvbnm0987654321mnbvcxzlkjhgfdsapoiuytrewwq1234567890"
    const optionLen = option.length;
    let ans = ""
    for(let i=0; i<length; i++){
        ans += option[Math.floor(Math.random() * optionLen)];
    }

    return ans;
}