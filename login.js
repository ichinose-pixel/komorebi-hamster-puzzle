import {validDate} from './daily.js?v=77f9ea4e4a11669e';
export const LOGIN_REWARDS=[3,3,5,5,7,7,10]         ;
                                                                  
export function validateLogin(ledger            ){
 if(!ledger||typeof ledger!=='object'||Array.isArray(ledger))throw Error('INVALID_LOGIN');
 const entries=Object.entries(ledger).sort(([a],[b])=>a.localeCompare(b));
 entries.forEach(([date,c],i)=>{const day=i%7+1;if(!validDate(date)||c?.day!==day||c.amount!==LOGIN_REWARDS[day-1])throw Error('INVALID_LOGIN_CLAIM');});
}
export function loginStatus(ledger            ={},date       ){
 if(!validDate(date))throw Error('INVALID_DATE');validateLogin(ledger);
 const dates=Object.keys(ledger).sort(),received=ledger[date],latest=dates.at(-1)||'';
 const day=received?.day??(dates.length%7+1);
 return {day,amount:LOGIN_REWARDS[day-1],received:!!received,available:!received&&date>latest,completed:received?day:dates.length%7};
}
export function claimLogin(ledger            ={},date       )            {
 const state=loginStatus(ledger,date);if(!state.available)return ledger;
 return {...ledger,[date]:{day:state.day,amount:state.amount}};
}
