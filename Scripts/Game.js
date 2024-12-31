```javascript
function StatVariance(n)
	{
	return n<1e3?Math.floor(n/50)+1:20
}
function RandomInRange(n,t)
	{
	return Math.floor(Math.random()*(t-n+1))+n
}
function CoinFlip()
	{
	return Math.random()<.5?!0:!1
}
function MutationCheck(n,t)
	{
	return n>=10?t>=(n-10)*100+450:t>=n*(n-1)*5
}
function UpgradeCost(n,t)
	{
	return t*Math.pow(10,n-1)
}
function LevelFromXp(n)
	{
	var t=Math.floor((Math.sqrt(4+8*n)-2)/4);
	return t>99?99:t
}
function SmartRound(n)
	{
	return n<100?Math.round(n*10)/10:Math.round(n)
}
function Shuffle(n)
	{
	for(var t=n.length,r,i;
	0!==t;
	)i=Math.floor(Math.random()*t),t-=1,r=n[t],n[t]=n[i],n[i]=r;
	return n
}
var ticksPerSecond=20,game,GameController=function()
	{
	function n()
		{
		this.generations=ko.observable(0);
		this.sorts=["score","base","bonus","vitality","strength","agility","bite","sting","mutations","mine","farm","carry","factory"];
		this.armySorts=["score","vitality","strength","agility","bite","sting","level"];
		this.femaleSort=ko.observable("score");
		this.maleSort=ko.observable("score");
		this.armySort=ko.observable("level");
		this.princessSort=ko.observable("score");
		this.princeSort=ko.observable("score");
		this.newGeneChanceRange=1e3;
		this.traitMax=999999;
		this.geneMax=100;
		this.missNewGene=ko.observable(0);
		this.newGeneChance=ko.computed(function()
			{
			return 10*(1+Math.floor(this.missNewGene()/25*10)/10)
		}
		,this);
		this.newestBorn=ko.observable(0);
		this.pauseBreeding=ko.observable(!1);
		this.carryPerSecondRaw=ko.observable(0);
		this.carryPerSecond=ko.computed(function()
			{
			return SmartRound(this.carryPerSecondRaw())
		}
		,this);
		this.dirtRaw=ko.observable(0);
		this.dirt=ko.computed(function()
			{
			return SmartRound(this.dirtRaw())
		}
		,this);
		this.factoryDirtRaw=ko.observable(0);
		this.factoryDirt=ko.computed(function()
			{
			return SmartRound(this.factoryDirtRaw())
		}
		,this);
		this.dirtPerSecondRaw=ko.observable(0);
		this.dirtPerSecond=ko.computed(function()
			{
			return SmartRound(this.dirtPerSecondRaw())
		}
		,this);
		this.grassRaw=ko.observable(0);
		this.grass=ko.computed(function()
			{
			return SmartRound(this.grassRaw())
		}
		,this);
		this.factoryGrassRaw=ko.observable(0);
		this.factoryGrass=ko.computed(function()
			{
			return SmartRound(this.factoryGrassRaw())
		}
		,this);
		this.grassPerSecondRaw=ko.observable(0);
		this.grassPerSecond=ko.computed(function()
			{
			return SmartRound(this.grassPerSecondRaw())
		}
		,this);
		this.mineDirtPerSecond=ko.observable(0);
		this.carryMineDirtPerSecond=ko.observable(0);
		this.factoryDirtPerSecond=ko.observable(0);
		this.farmGrassPerSecond=ko.observable(0);
		this.carryFarmGrassPerSecond=ko.observable(0);
		this.factoryGrassPerSecond=ko.observable(0);
		this.factorySodPerSecond=ko.observable(0);
		this.sodPerSecondForBreeding=ko.observable(0);
		this.sodRaw=ko.observable(0);
		this.sod=ko.computed(function()
			{
			return SmartRound(this.sodRaw())
		}
		,this);
		this.sodPerSecondRaw=ko.observable(0);
		this.sodPerSecond=ko.computed(function()
			{
			return SmartRound(this.sodPerSecondRaw())
		}
		,this);
		this.mother=ko.observable();
		this.father=ko.observable();
		this.princess=ko.observable();
		this.prince=ko.observable();
		this.sodDedicatedToBreeding=ko.observable(0);
		this.isHeirsUnlocked=ko.observable(!1);
		this.boosts=ko.observable(10);
		this.maxBoosts=ko.observable(10);
		this.maleMound=ko.observableArray([]).extend(
			{
			rateLimit:100
		}
		);
		this.femaleMound=ko.observableArray([]).extend(
			{
			rateLimit:100
		}
		);
		this.princeMound=ko.observableArray([]).extend(
			{
			rateLimit:100
		}
		);
		this.princessMound=ko.observableArray([]).extend(
			{
			rateLimit:100
		}
		);
		this.farmMound=ko.observableArray([]).extend(
			{
			rateLimit:100
		}
		);
		this.mineMound=ko.observableArray([]).extend(
			{
			rateLimit:100
		}
		);
		this.carrierMound=ko.observableArray([]).extend(
			{
			rateLimit:100
		}
		);
		this.factoryMound=ko.observableArray([]).extend(
			{
			rateLimit:100
		}
		);
		this.armyMound=ko.observableArray([]).extend(
			{
			rateLimit:100
		}
		);
		this.maxMaleMoundSize=ko.observable(1);
		this.maleMoundEmpty=ko.computed(function()
			{
			for(var n=[],t=0;
			t<this.maxMaleMoundSize()-this.maleMound().length;
			t++)n.push(null);
			return n
		}
		,this);
		this.maxPrincessMoundSize=ko.observable(1);
		this.princessMoundEmpty=ko.computed(function()
			{
			for(var n=[],t=0;
			t<this.maxPrincessMoundSize()-this.princessMound().length;
			t++)n.push(null);
			return n
		}
		,this);
		this.maxPrinceMoundSize=ko.observable(1);
		this.princeMoundEmpty=ko.computed(function()
			{
			for(var n=[],t=0;
			t<this.maxPrinceMoundSize()-this.princeMound().length;
			t++)n.push(null);
			return n
		}
		,this);
		this.maxFemaleMoundSize=ko.observable(1);
		this.femaleMoundEmpty=ko.computed(function()
			{
			for(var n=[],t=0;
			t<this.maxFemaleMoundSize()-this.femaleMound().length;
			t++)n.push(null);
			return n
		}
		,this);
		this.maxFarmMoundSize=ko.observable(1);
		this.farmMoundEmpty=ko.computed(function()
			{
			for(var n=[],t=0;
			t<this.maxFarmMoundSize()-this.farmMound().length;
			t++)n.push(null);
			return n
		}
		,this);
		this.maxMineMoundSize=ko.observable(1);
		this.mineMoundEmpty=ko.computed(function()
			{
			for(var n=[],t=0;
			t<this.maxMineMoundSize()-this.mineMound().length;
			t++)n.push(null);
			return n
		}
		,this);
		this.maxCarrierMoundSize=ko.observable(1);
		this.carrierMoundEmpty=ko.computed(function()
			{
			for(var n=[],t=0;
			t<this.maxCarrierMoundSize()-this.carrierMound().length;
			t++)n.push(null);
			return n
		}
		,this);
		this.maxFactoryMoundSize=ko.observable(1);
		this.factoryMoundEmpty=ko.computed(function()
			{
			for(var n=[],t=0;
			t<this.maxFactoryMoundSize()-this.factoryMound().length;
			t++)n.push(null);
			return n
		}
		,this);
		this.maxArmyMoundSize=ko.observable(1);
		this.armyMoundEmpty=ko.computed(function()
			{
			for(var n=[],t=0;
			t<this.maxArmyMoundSize()-this.armyMound().length;
			t++)n.push(null);
			return n
		}
		,this);
		this.bonusFarmPercent=ko.observable(0);
		this.farmMoundUpgradeCost=ko.computed(function()
			{
			return UpgradeCost(this.maxFarmMoundSize(),500)
		}
		,this);
		this.bonusMinePercent=ko.observable(0);
		this.mineMoundUpgradeCost=ko.computed(function()
			{
			return UpgradeCost(this.maxMineMoundSize(),500)
		}
		,this);
		this.bonusCarrierPercent=ko.observable(0);
		this.carrierMoundUpgradeCost=ko.computed(function()
			{
			return UpgradeCost(this.maxCarrierMoundSize(),500)
		}
		,this);
		this.bonusFactoryPercent=ko.observable(0);
		this.factoryMoundUpgradeCost=ko.computed(function()
			{
			return UpgradeCost(this.maxFactoryMoundSize(),500)
		}
		,this);
		this.armyMoundUpgradeCost=ko.computed(function()
			{
			return UpgradeCost(this.maxArmyMoundSize(),500)
		}
		,this);
		this.maleMoundUpgradeCost=ko.computed(function()
			{
			return UpgradeCost(this.maxMaleMoundSize(),10)
		}
		,this);
		this.femaleMoundUpgradeCost=ko.computed(function()
			{
			return UpgradeCost(this.maxFemaleMoundSize(),10)
		}
		,this);
		this.princeMoundUpgradeCost=ko.computed(function()
			{
			return UpgradeCost(this.maxPrinceMoundSize(),10)
		}
		,this);
		this.princessMoundUpgradeCost=ko.computed(function()
			{
			return UpgradeCost(this.maxPrincessMoundSize(),10)
		}
		,this);
		this.lowestMiner=ko.computed(function()
			{
			return this.mineMound().length>0?this.mineMound()[this.mineMound().length-1].dirtPerSecond:0
		}
		,this);
		this.lowestFarmer=ko.computed(function()
			{
			return this.farmMound().length>0?this.farmMound()[this.farmMound().length-1].grassPerSecond:0
		}
		,this);
		this.lowestCarrier=ko.computed(function()
			{
			return this.carrierMound().length>0?this.carrierMound()[this.carrierMound().length-1].carryPerSecond:0
		}
		,this);
		this.lowestFactory=ko.computed(function()
			{
			return this.factoryMound().length>0?this.factoryMound()[this.factoryMound().length-1].sodPerSecond:0
		}
		,this);
		this.atWar=ko.observable(!1);
		this.showTreasure=ko.observable(!1);
		this.treasureTitle=ko.observable("");
		this.treasureText=ko.observable("");
		this.battleTurnLength=ko.observable(ticksPerSecond/2);
		this.battleTurnClock=0;
		this.inBattle=ko.observable(!1);
		this.battleDamage=ko.observable(0);
		this.battleAttacker=null;
		this.battleDefender=null;
		this.battleDefenderId=ko.observable(0);
		this.battleAttackerId=ko.observable(0);
		this.battleDefenderTrait=ko.observable(0);
		this.battleAttackerTrait=ko.observable(0);
		this.battleDefenderMound=ko.observableArray();
		this.battleOrder=ko.observableArray();
		this.battleOrderIndex=ko.observable(0);
		this.pauseExplore=ko.observable(!1);
		this.exploreTime=ticksPerSecond*30;
		this.exploreClock=ko.observable(this.exploreTime);
		this.exploreClockPercentage=ko.computed(function()
			{
			return Math.round(1e4-this.exploreClock()/this.exploreTime*1e4)/100+"%"
		}
		,this);
		this.pauseAutoBattle=ko.observable(!1);
		this.autoBattleTime=ticksPerSecond*60;
		this.autoBattleClock=ko.observable(this.autoBattleTime);
		this.autoBattleClockPercentage=ko.computed(function()
			{
			return Math.round(1e4-this.autoBattleClock()/this.autoBattleTime*1e4)/100+"%"
		}
		,this);
		this.map=ko.observable(new GameMap);
		this.nations=ko.observableArray();
		this.nation=ko.observable();
		this.achievements=ko.observableArray();
		this.achievementCounts=[];
		this.achievementsUnlocked=ko.observable(0);
this.totalBonusMultiplier=ko.observable(1);
		this.armyUpgrades=ko.observable(new ArmyUpgrades);
		this.achievementCheck=10*ticksPerSecond;
		this.saveCheck=60*ticksPerSecond;
		for(var n=0;
		n<23;
		n++)this.achievementCounts.push(new AchievementCount(n));
		this.mother(this.DefaultCritter(0,0,1));
		this.father(this.DefaultCritter(1,0,1));
		this.mother().CalculateScore();
		this.father().CalculateScore();
		this.princess(this.DefaultCritter(0,0,1));
		this.prince(this.DefaultCritter(1,0,1));
		this.princess().CalculateScore();
		this.prince().CalculateScore();
		this.nations.push(new Nation(15,0,"crickets","balanced",5,50,1,null,1));
		this.nations.push(new Nation(16,0,"ants","balanced",1e3,2e3,4,15,2));
		this.nations.push(new Nation(17,0,"grasshoppers","balanced",15e3,25e3,7,16,3));
		this.nations.push(new Nation(0,4,"gnats","high numbers",50,100,1,15,1));
		this.nations.push(new Nation(2,4,"chiggers","high numbers",2e3,3e3,4,0,2));
		this.nations.push(new Nation(1,4,"ladybugs","high numbers",25e3,5e4,7,2,3));
		this.nations.push(new Nation(5,2,"bees","high sting",100,200,2,0,1));
		this.nations.push(new Nation(3,2,"wasps","high sting",3e3,5e3,5,5,2));
		this.nations.push(new Nation(4,2,"scorpions","high sting",5e4,75e3,8,3,3));
		this.nations.push(new Nation(9,1,"beetles","high bite",200,300,2,5,1));
		this.nations.push(new Nation(10,1,"horseflies","high bite",5e3,7500,5,9,2));
		this.nations.push(new Nation(11,1,"termites","high bite",75e3,1e5,8,10,3));
		this.nations.push(new Nation(12,3,"ticks","high health",300,500,3,9,1));
		this.nations.push(new Nation(13,3,"mosquitoes","high health",7500,1e4,6,12,2));
		this.nations.push(new Nation(14,3,"leeches","high health",1e5,125e3,9,13,3));
		this.nations.push(new Nation(8,5,"centipedes","solo fighter",500,1e3,3,12,1));
		this.nations.push(new Nation(7,5,"praying mantis","solo fighter",1e4,15e3,6,8,2));
		this.nations.push(new Nation(6,5,"tarantulas","solo fighter",125e3,15e4,9,7,3));
		this.nations()[0].isUnlocked(!0);
		this.nation(this.nations()[0]);
		this.achievements.push(new Achievement(0,"Breed 10 Vitality","Breed a critter with a Vitality of 10",10));
		this.achievements.push(new Achievement(0,"Breed 25 Vitality","Breed a critter with a Vitality of 25",25));
		this.achievements.push(new Achievement(0,"Breed 50 Vitality","Breed a critter with a Vitality of 50",50));
		this.achievements.push(new Achievement(0,"Breed 100 Vitality","Breed a critter with a Vitality of 100",100));
		this.achievements.push(new Achievement(0,"Breed 250 Vitality","Breed a critter with a Vitality of 250",250));
		this.achievements.push(new Achievement(0,"Breed 500 Vitality","Breed a critter with a Vitality of 500",500));
		this.achievements.push(new Achievement(0,"Breed 1,000 Vitality","Breed a critter with a Vitality of 1,000",1e3));
		this.achievements.push(new Achievement(0,"Breed 5,000 Vitality","Breed a critter with a Vitality of 5,000",5e3));
		this.achievements.push(new Achievement(0,"Breed 10,000 Vitality","Breed a critter with a Vitality of 10,000",1e4));
		this.achievements.push(new Achievement(0,"Breed 50,000 Vitality","Breed a critter with a Vitality of 50,000",5e4));
		this.achievements.push(new Achievement(0,"Breed 75,000 Vitality","Breed a critter with a Vitality of 75,000",75e3));        this.achievements.push(new Achievement(0,"Breed 100,000 Vitality","Breed a critter with a Vitality of 100,000",1e5, 5));
		this.achievements.push(new Achievement(1,"Breed 10 Strength","Breed a critter with a Strength of 10",10));
		this.achievements.push(new Achievement(1,"Breed 25 Strength","Breed a critter with a Strength of 25",25));
		this.achievements.push(new Achievement(1,"Breed 50 Strength","Breed a critter with a Strength of 50",50));
		this.achievements.push(new Achievement(1,"Breed 100 Strength","Breed a critter with a Strength of 100",100));
		this.achievements.push(new Achievement(1,"Breed 250 Strength","Breed a critter with a Strength of 250",250));
		this.achievements.push(new Achievement(1,"Breed 500 Strength","Breed a critter with a Strength of 500",500));
		this.achievements.push(new Achievement(1,"Breed 1,000 Strength","Breed a critter with a Strength of 1,000",1e3));
		this.achievements.push(new Achievement(1,"Breed 5,000 Strength","Breed a critter with a Strength of 5,000",5e3));
		this.achievements.push(new Achievement(1,"Breed 10,000 Strength","Breed a critter with a Strength of 10,000",1e4));
		this.achievements.push(new Achievement(1,"Breed 50,000 Strength","Breed a critter with a Strength of 50,000",5e4));
		this.achievements.push(new Achievement(1,"Breed 75,000 Strength","Breed a critter with a Strength of 75,000",75e3));        this.achievements.push(new Achievement(1,"Breed 100,000 Strength","Breed a critter with a Strength of 100,000",1e5, 5));
		this.achievements.push(new Achievement(2,"Breed 10 Agility","Breed a critter with a Agility of 10",10));
		this.achievements.push(new Achievement(2,"Breed 25 Agility","Breed a critter with a Agility of 25",25));
		this.achievements.push(new Achievement(2,"Breed 50 Agility","Breed a critter with a Agility of 50",50));
		this.achievements.push(new Achievement(2,"Breed 100 Agility","Breed a critter with a Agility of 100",100));
		this.achievements.push(new Achievement(2,"Breed 250 Agility","Breed a critter with a Agility of 250",250));
		this.achievements.push(new Achievement(2,"Breed 500 Agility","Breed a critter with a Agility of 500",500));
		this.achievements.push(new Achievement(2,"Breed 1,000 Agility","Breed a critter with a Agility of 1,000",1e3));
		this.achievements.push(new Achievement(2,"Breed 5,000 Agility","Breed a critter with a Agility of 5,000",5e3));
		this.achievements.push(new Achievement(2,"Breed 10,000 Agility","Breed a critter with a Agility of 10,000",1e4));
		this.achievements.push(new Achievement(2,"Breed 50,000 Agility","Breed a critter with a Agility of 50,000",5e4));
		this.achievements.push(new Achievement(2,"Breed 75,000 Agility","Breed a critter with a Agility of 75,000",75e3));        this.achievements.push(new Achievement(2,"Breed 100,000 Agility","Breed a critter with a Agility of 100,000",1e5, 5));
		this.achievements.push(new Achievement(3,"Breed 10 Bite","Breed a critter with a Bite of 10",10));
		this.achievements.push(new Achievement(3,"Breed 25 Bite","Breed a critter with a Bite of 25",25));
		this.achievements.push(new Achievement(3,"Breed 50 Bite","Breed a critter with a Bite of 50",50));
		this.achievements.push(new Achievement(3,"Breed 100 Bite","Breed a critter with a Bite of 100",100));
		this.achievements.push(new Achievement(3,"Breed 250 Bite","Breed a critter with a Bite of 250",250));
		this.achievements.push(new Achievement(3,"Breed 500 Bite","Breed a critter with a Bite of 500",500));
		this.achievements.push(new Achievement(3,"Breed 1,000 Bite","Breed a critter with a Bite of 1,000",1e3));
		this.achievements.push(new Achievement(3,"Breed 5,000 Bite","Breed a critter with a Bite of 5,000",5e3));
		this.achievements.push(new Achievement(3,"Breed 10,000 Bite","Breed a critter with a Bite of 10,000",1e4));
		this.achievements.push(new Achievement(3,"Breed 50,000 Bite","Breed a critter with a Bite of 50,000",5e4));
		this.achievements.push(new Achievement(3,"Breed 75,000 Bite","Breed a critter with a Bite of 75,000",75e3));
		this.achievements.push(new Achievement(3,"Breed 100,000 Bite","Breed a critter with a Bite of 100,000",1e5));
		this.achievements.push(new Achievement(4,"Breed 10 Sting","Breed a critter with a Sting of 10",10));
		this.achievements.push(new Achievement(4,"Breed 25 Sting","Breed a critter with a Sting of 25",25));
		this.achievements.push(new Achievement(4,"Breed 50 Sting","Breed a critter with a Sting of 50",50));
		this.achievements.push(new Achievement(4,"Breed 100 Sting","Breed a critter with a Sting of 100",100));
		this.achievements.push(new Achievement(4,"Breed 250 Sting","Breed a critter with a Sting of 250",250));
		this.achievements.push(new Achievement(4,"Breed 500 Sting","Breed a critter with a Sting of 500",500));
		this.achievements.push(new Achievement(4,"Breed 1,000 Sting","Breed a critter with a Sting of 1,000",1e3));
		this.achievements.push(new Achievement(4,"Breed 5,000 Sting","Breed a critter with a Sting of 5,000",5e3));
		this.achievements.push(new Achievement(4,"Breed 10,000 Sting","Breed a critter with a Sting of 10,000",1e4));
		this.achievements.push(new Achievement(4,"Breed 50,000 Sting","Breed a critter with a Sting of 50,000",5e4));
		this.achievements.push(new Achievement(4,"Breed 75,000 Sting","Breed a critter with a Sting of 75,000",75e3));
		this.achievements.push(new Achievement(4,"Breed 100,000 Sting","Breed a critter with a Sting of 100,000",1e5));
		this.achievements.push(new Achievement(13,"Breed 1 Mutation","Breed a critter with 1 Mutation",1));
		this.achievements.push(new Achievement(13,"Breed 2 Mutations","Breed a critter with 2 Mutations",2));
		this.achievements.push(new Achievement(13,"Breed 5 Mutations","Breed a critter with 5 Mutations",5));
		this.achievements.push(new Achievement(13,"Breed 10 Mutations","Breed a critter with 10 Mutations",10));
		this.achievements.push(new Achievement(13,"Breed 15 Mutations","Breed a critter with 15 Mutations",15));
		this.achievements.push(new Achievement(13,"Breed 20 Mutations","Breed a critter with 20 Mutations",20));
		this.achievements.push(new Achievement(13,"Breed 25 Mutations","Breed a critter with 25 Mutations",25));
		this.achievements.push(new Achievement(13,"Breed 50 Mutations","Breed a critter with 50 Mutations",50));
		this.achievements.push(new Achievement(5,"Breed 10 Score","Breed a critter with a Score of 10",10));
		this.achievements.push(new Achievement(5,"Breed 50 Score","Breed a critter with a Score of 50",50));
		this.achievements.push(new Achievement(5,"Breed 100 Score","Breed a critter with a Score of 100",100));
		this.achievements.push(new Achievement(5,"Breed 250 Score","Breed a critter with a Score of 250",250));
		this.achievements.push(new Achievement(5,"Breed 500 Score","Breed a critter with a Score of 500",500));
		this.achievements.push(new Achievement(5,"Breed 1,000 Score","Breed a critter with a Score of 1,000",1e3));
		this.achievements.push(new Achievement(5,"Breed 5,000 Score","Breed a critter Score of 5,000",5e3));
		this.achievements.push(new Achievement(5,"Breed 10,000 Score","Breed a critter with a Score of 10,000",1e4));
		this.achievements.push(new Achievement(5,"Breed 50,000 Score","Breed a critter with a Score of 50,000",5e4));
		this.achievements.push(new Achievement(5,"Breed 75,000 Score","Breed a critter with a Score of 75,000",75e3));
		this.achievements.push(new Achievement(5,"Breed 100,000 Score","Breed a critter with a Score of 100,000",1e5));
		this.achievements.push(new Achievement(7,"Breed 25 Generations","Breed a critter with a Generation of 25",25));
		this.achievements.push(new Achievement(7,"Breed 50 Generations","Breed a critter with a Generation of 50",50));
		this.achievements.push(new Achievement(7,"Breed 100 Generations","Breed a critter with a Generation of 100",100));
		this.achievements.push(new Achievement(7,"Breed 200 Generations","Breed a critter with a Generation of 200",200));
		this.achievements.push(new Achievement(7,"Breed 300 Generations","Breed a critter with a Generation of 300",300));
		this.achievements.push(new Achievement(7,"Breed 500 Generations","Breed a critter with a Generation of 500",500));
		this.achievements.push(new Achievement(7,"Breed 750 Generations","Breed a critter with a Generation of 750",750));
		this.achievements.push(new Achievement(7,"Breed 1,000 Generations","Breed a critter with a Generation of 1,000",1e3));
		this.achievements.push(new Achievement(7,"Breed 1,500 Generations","Breed a critter with a Generation of 1,500",1500));
		this.achievements.push(new Achievement(7,"Breed 2,000 Generations","Breed a critter with a Generation of 2,000",2e3));
		this.achievements.push(new Achievement(6,"Breed 250 Critters","Breed 250 Critters",250));
		this.achievements.push(new Achievement(6,"Breed 500 Critters","Breed 500 Critters",500));
		this.achievements.push(new Achievement(6,"Breed 1,000 Critters","Breed 1,000 Critters",1e3));
		this.achievements.push(new Achievement(6,"Breed 2,000 Critters","Breed 2,000 Critters",2e3));
		this.achievements.push(new Achievement(6,"Breed 3,000 Critters","Breed 3,000 Critters",3e3));
		this.achievements.push(new Achievement(6,"Breed 5,000 Critters","Breed 5,000 Critters",5e3));
		this.achievements.push(new Achievement(6,"Breed 7,500 Critters","Breed 7,500 Critters",7500));
		this.achievements.push(new Achievement(6,"Breed 10,000 Critters","Breed 10,000 Critters",1e4));
		this.achievements.push(new Achievement(6,"Breed 15,000 Critters","Breed 15,000 Critters",15e3));
		this.achievements.push(new Achievement(6,"Breed 20,000 Critters","Breed 20,000 Critters",2e4));
		this.achievements.push(new Achievement(6,"Breed 50,000 Critters","Breed 50,000 Critters",2e4));
		this.achievements.push(new Achievement(9,"Mine 5 Dirt/sec","Mine Dirt/sec of 5",5));
		this.achievements.push(new Achievement(9,"Mine 10 Dirt/sec","Mine Dirt/sec of 10",10));
		this.achievements.push(new Achievement(9,"Mine 100 Dirt/sec","Mine Dirt/sec of 100",100));
		this.achievements.push(new Achievement(9,"Mine 500 Dirt/sec","Mine Dirt/sec of 500",500));
		this.achievements.push(new Achievement(9,"Mine 1,000 Dirt/sec","MiMine Dirt/sec of 1,000",1e3));
		this.achievements.push(new Achievement(9,"Mine 2,500 Dirt/sec","Mine Dirt/sec of 2,500",2500));
		this.achievements.push(new Achievement(9,"Mine 5,000 Dirt/sec","Mine Dirt/sec of 5,000",5e3));
		this.achievements.push(new Achievement(9,"Mine 10,000 Dirt/sec","Mine Dirt/sec of 10,000",1e4));
		this.achievements.push(new Achievement(9,"Mine 50,000 Dirt/sec","Mine Dirt/sec of 50,000",5e4));
		this.achievements.push(new Achievement(9,"Mine 100,000 Dirt/sec","Mine Dirt/sec of 100,000",1e5));
		this.achievements.push(new Achievement(9,"Mine 200,000 Dirt/sec","Mine Dirt/sec of 200,000",2e5));
		this.achievements.push(new Achievement(9,"Mine 300,000 Dirt/sec","Mine Dirt/sec of 300,000",3e5));
		this.achievements.push(new Achievement(9,"Mine 500,000 Dirt/sec","Mine Dirt/sec of 500,000",5e5));
		this.achievements.push(new Achievement(15,"Farm 5 Grass/sec","Farm Grass/sec of 5",5));
		this.achievements.push(new Achievement(15,"Farm 10 Grass/sec","Farm Grass/sec of 10",10));
		this.achievements.push(new Achievement(15,"Farm 100 Grass/sec","Farm Grass/sec of 100",100));
		this.achievements.push(new Achievement(15,"Farm 500 Grass/sec","Farm Grass/sec of 500",500));
		this.achievements.push(new Achievement(15,"Farm 1,000 Grass/sec","MiFarm Grass/sec of 1,000",1e3));
		this.achievements.push(new Achievement(15,"Farm 2,500 Grass/sec","Farm Grass/sec of 2,500",2500));
		this.achievements.push(new Achievement(15,"Farm 5,000 Grass/sec","Farm Grass/sec of 5,000",5e3));
		this.achievements.push(new Achievement(15,"Farm 10,000 Grass/sec","Farm Grass/sec of 10,000",1e4));
		this.achievements.push(new Achievement(15,"Farm 50,000 Grass/sec","Farm Grass/sec of 50,000",5e4));
		this.achievements.push(new Achievement(15,"Farm 100,000 Grass/sec","Farm Grass/sec of 100,000",1e5));
		this.achievements.push(new Achievement(15,"Farm 200,000 Grass/sec","Farm Grass/sec of 200,000",2e5));
		this.achievements.push(new Achievement(15,"Farm 300,000 Grass/sec","Farm Grass/sec of 300,000",3e5));
		this.achievements.push(new Achievement(15,"Farm 500,000 Grass/sec","Farm Grass/sec of 500,000",5e5));
		this.achievements.push(new Achievement(16,"Produce 5 Sod/sec","Produce Sod/sec of 5",5));
		this.achievements.push(new Achievement(16,"Produce 10 Sod/sec","Produce Sod/sec of 10",10));
		this.achievements.push(new Achievement(16,"Produce 100 Sod/sec","Produce Sod/sec of 100",100));
		this.achievements.push(new Achievement(16,"Produce 500 Sod/sec","Produce Sod/sec of 500",500));
		this.achievements.push(new Achievement(16,"Produce 1,000 Sod/sec","MiProduce Sod/sec of 1,000",1e3));
		this.achievements.push(new Achievement(16,"Produce 2,500 Sod/sec","Produce Sod/sec of 2,500",2500));
		this.achievements.push(new Achievement(16,"Produce 5,000 Sod/sec","Produce Sod/sec of 5,000",5e3));
		this.achievements.push(new Achievement(16,"Produce 10,000 Sod/sec","Produce Sod/sec of 10,000",1e4));
		this.achievements.push(new Achievement(16,"Produce 50,000 Sod/sec","Produce Sod/sec of 50,000",5e4));
		this.achievements.push(new Achievement(16,"Produce 100,000 Sod/sec","Produce Sod/sec of 100,000",1e5));
		this.achievements.push(new Achievement(16,"Produce 200,000 Sod/sec","Produce Sod/sec of 200,000",2e5));
		this.achievements.push(new Achievement(16,"Produce 300,000 Sod/sec","Produce Sod/sec of 300,000",3e5));
		this.achievements.push(new Achievement(16,"Produce 500,000 Sod/sec","Produce Sod/sec of 500,000",5e5));
		this.achievements.push(new Achievement(8,"Win 50 Battles","Win 50 Battles",50));
		this.achievements.push(new Achievement(8,"Win 100 Battles","Win 100 Battles",100));
		this.achievements.push(new Achievement(8,"Win 250 Battles","Win 250 Battles",250));
		this.achievements.push(new Achievement(8,"Win 500 Battles","Win 500 Battles",500));
		this.achievements.push(new Achievement(8,"Win 1,000 Battles","Win 1,000 Battles",1e3));
		this.achievements.push(new Achievement(8,"Win 2,000 Battles","Win 2,000 Battles",2e3));
		this.achievements.push(new Achievement(8,"Win 3,000 Battles","Win 3,000 Battles",3e3));
		this.achievements.push(new Achievement(8,"Win 5,000 Battles","Win 5,000 Battles",5e3));
		this.achievements.push(new Achievement(8,"Win 7,500 Battles","Win 7,500 Battles",7500));
		this.achievements.push(new Achievement(8,"Win 10,000 Battles","Win 10,000 Battles",1e4));
		this.achievements.push(new Achievement(10,"Find 1 Mine","Find 1 Mine",1));
		this.achievements.push(new Achievement(10,"Find 3 Mines","Find 3 Mines",3));
		this.achievements.push(new Achievement(10,"Find 6 Mines","Find 6 Mines",6));
		this.achievements.push(new Achievement(10,"Find 9 Mines","Find 9 Mines",9));
		this.achievements.push(new Achievement(10,"Find 12 Mines","Find 12 Mines",12));
		this.achievements.push(new Achievement(10,"Find 15 Mines","Find 15 Mines",15));
		this.achievements.push(new Achievement(10,"Find 18 Mines","Find 18 Mines",18));
		this.achievements.push(new Achievement(18,"Find 1 Farm","Find 1 Farm",1));
		this.achievements.push(new Achievement(18,"Find 3 Farms","Find 3 Farms",3));
		this.achievements.push(new Achievement(18,"Find 6 Farms","Find 6 Farms",6));
		this.achievements.push(new Achievement(18,"Find 9 Farms","Find 9 Farms",9));
		this.achievements.push(new Achievement(18,"Find 12 Farms","Find 12 Farms",12));
		this.achievements.push(new Achievement(18,"Find 15 Farms","Find 15 Farms",15));
		this.achievements.push(new Achievement(18,"Find 18 Farms","Find 18 Farms",18));
		this.achievements.push(new Achievement(19,"Find 1 Equipment","Find 1 Equipment",1));
		this.achievements.push(new Achievement(19,"Find 3 Equipment","Find 3 Equipment",3));
		this.achievements.push(new Achievement(19,"Find 6 Equipment","Find 6 Equipment",6));
		this.achievements.push(new Achievement(19,"Find 9 Equipment","Find 9 Equipment",9));
		this.achievements.push(new Achievement(19,"Find 12 Equipment","Find 12 Equipment",12));
		this.achievements.push(new Achievement(19,"Find 15 Equipment","Find 15 Equipment",15));
		this.achievements.push(new Achievement(19,"Find 18 Equipment","Find 18 Equipment",18));
		this.achievements.push(new Achievement(20,"Find 1 Factory","Find 1 Factory",1));
		this.achievements.push(new Achievement(20,"Find 3 Factories","Find 3 Factories",3));
		this.achievements.push(new Achievement(20,"Find 6 Factories","Find 6 Factories",6));
		this.achievements.push(new Achievement(20,"Find 9 Factories","Find 9 Factories",9));
		this.achievements.push(new Achievement(20,"Find 12 Factories","Find 12 Factories",12));
		this.achievements.push(new Achievement(20,"Find 15 Factories","Find 15 Factories",15));
		this.achievements.push(new Achievement(20,"Find 18 Factories","Find 18 Factories",18));
		this.achievements.push(new Achievement(11,"Find 1 Enemy Gene","Find 1 Enemy Gene",1));
		this.achievements.push(new Achievement(11,"Find 3 Enemy Genes","Find 3 Enemy Genes",3));
		this.achievements.push(new Achievement(11,"Find 6 Enemy Genes","Find 6 Enemy Genes",6));
		this.achievements.push(new Achievement(11,"Find 9 Enemy Genes","Find 9 Enemy Genes",9));
		this.achievements.push(new Achievement(11,"Find 12 Enemy Genes","Find 12 Enemy Genes",12));
		this.achievements.push(new Achievement(11,"Find 15 Enemy Genes","Find 15 Enemy Genes",15));
		this.achievements.push(new Achievement(11,"Find 18 Enemy Genes","Find 18 Enemy Genes",18));
		this.achievements.push(new Achievement(12,"Find 1 High Ground","Find 1 High Ground",1));
		this.achievements.push(new Achievement(12,"Find 3 High Ground","Find 3 High Ground",3));
		this.achievements.push(new Achievement(12,"Find 6 High Ground","Find 6 High Ground",6));
		this.achievements.push(new Achievement(12,"Find 9 High Ground","Find 9 High Ground",9));
		this.achievements.push(new Achievement(12,"Find 12 High Ground","Find 12 High Ground",12));
		this.achievements.push(new Achievement(12,"Find 15 High Ground","Find 15 High Ground",15));
		this.achievements.push(new Achievement(12,"Find 18 High Ground","Find 18 High Ground",18));
		this.achievements.push(new Achievement(14,"Find 1 Boost Upgrade","Find 1 Boost Upgrade",1));
		this.achievements.push(new Achievement(14,"Find 3 Boost Upgrades","Find 3 Boost Upgrades",3));
		this.achievements.push(new Achievement(14,"Find 6 Boost Upgrades","Find 6 Boost Upgrades",6));
		this.achievements.push(new Achievement(14,"Find 9 Boost Upgrades","Find 9 Boost Upgrades",9));
		this.achievements.push(new Achievement(14,"Find 12 Boost Upgrades","Find 12 Boost Upgrades",12));
		this.achievements.push(new Achievement(14,"Find 15 Boost Upgrades","Find 15 Boost Upgrades",15));
		this.achievements.push(new Achievement(14,"Find 18 Boost Upgrades","Find 18 Boost Upgrades",18));
		this.achievements.push(new Achievement(21,"Complete 1 Map","Finish 1 Map 100%",1));
		this.achievements.push(new Achievement(21,"Complete 3 Maps","Finish 3 Maps 100%",3));
		this.achievements.push(new Achievement(21,"Complete 6 Maps","Finish 6 Maps 100%",6));
		this.achievements.push(new Achievement(21,"Complete 9 Maps","Finish 9 Maps 100%",9));
		this.achievements.push(new Achievement(21,"Complete 12 Maps","Finish 12 Maps 100%",12));
		this.achievements.push(new Achievement(21,"Complete 15 Maps","Finish 15 Maps 100%",15));
		this.achievements.push(new Achievement(21,"Complete 18 Maps","Finish 18 Maps 100%",18));
		this.achievements.push(new Achievement(22,"Find 1 Fort","Find 1 Fort",1));
		this.achievements.push(new Achievement(22,"Find 3 Forts","Find 3 Forts",3));
		this.achievements.push(new Achievement(22,"Find 6 Forts","Find 6 Forts",6));
		this.achievements.push(new Achievement(22,"Find 9 Forts","Find 9 Forts",9));
		this.achievements.push(new Achievement(22,"Find 12 Forts","Find 12 Forts",12));
		this.achievements.push(new Achievement(22,"Find 15 Forts","Find 15 Forts",15));
		this.achievements.push(new Achievement(22,"Find 18 Forts","Find 18 Forts",18))
	}
	return n.prototype.Tick=function()
		{
		this.BreedCheck(!1);
		this.AutoBattle();
		this.Explore();
		this.Battle();
		this.CalculateProduction();
		this.CheckAchievements();
		this.CheckSave()
	}
	,n.prototype.UpdateProduction=function()
		{
		for(var t,i,r,u=0,n=0;
		n<this.farmMound().length;
		n++)u+=this.farmMound()[n].grassPerSecond;
		for(this.grassPerSecondRaw(u*(1+this.bonusFarmPercent()/100)),this.achievementCounts[15].Update(this.grassPerSecondRaw()),t=0,n=0;
		n<this.mineMound().length;
		n++)t+=this.mineMound()[n].dirtPerSecond;
		for(this.dirtPerSecondRaw(t*(1+this.bonusMinePercent()/100)),this.achievementCounts[9].Update(this.dirtPerSecondRaw()),i=0,n=0;
		n<this.carrierMound().length;
		n++)i+=this.carrierMound()[n].carryPerSecond;
		for(this.carryPerSecondRaw(i*(1+this.bonusCarrierPercent()/100)),this.achievementCounts[17].Update(this.carryPerSecondRaw()),r=0,n=0;
		n<this.factoryMound().length;
		n++)r+=this.factoryMound()[n].sodPerSecond;
		this.sodPerSecondRaw(r*(1+this.bonusFactoryPercent()/100));
		this.achievementCounts[16].Update(this.sodPerSecondRaw())
	}
	,n.prototype.CalculateProduction=function()
		{
		var t,i,n,r;
		this.dirtRaw(this.dirtRaw()+this.dirtPerSecondRaw()/ticksPerSecond);
		this.grassRaw(this.grassRaw()+this.grassPerSecondRaw()/ticksPerSecond);
		t=this.carryPerSecondRaw()/ticksPerSecond;
		t>this.dirtRaw()&&(t=this.dirtRaw());
		this.dirtRaw(this.dirtRaw()-t);
		this.factoryDirtRaw(this.factoryDirtRaw()+t);
		i=this.carryPerSecondRaw()/ticksPerSecond;
		i>this.grassRaw()&&(i=this.grassRaw());
		this.grassRaw(this.grassRaw()-i);
		this.factoryGrassRaw(this.factoryGrassRaw()+i);
		n=this.sodPerSecondRaw()/ticksPerSecond;
		r=Math.min(this.factoryDirtRaw(),this.factoryGrassRaw());
		n>r&&(n=r);
		n>0&&(this.factoryDirtRaw(this.factoryDirtRaw()-n),this.factoryGrassRaw(this.factoryGrassRaw()-n),this.sodRaw(this.sodRaw()+n));
		this.carryMineDirtPerSecond(SmartRound(this.dirtRaw()>this.carryPerSecond()?this.carryPerSecondRaw():this.dirtPerSecondRaw()));
		this.carryFarmGrassPerSecond(SmartRound(this.grassRaw()>this.carryPerSecond()?this.carryPerSecondRaw():this.grassPerSecondRaw()));
		this.mineDirtPerSecond(SmartRound(this.dirtPerSecondRaw()-this.carryMineDirtPerSecond()));
		this.farmGrassPerSecond(SmartRound(this.grassPerSecondRaw()-this.carryFarmGrassPerSecond()));
		this.factoryDirtRaw()>this.sodPerSecondRaw()&&this.factoryGrassRaw()>this.sodPerSecondRaw()?this.factorySodPerSecond(SmartRound(this.sodPerSecondRaw())):this.factoryDirtRaw()>this.sodPerSecondRaw()?this.factorySodPerSecond(SmartRound(this.carryFarmGrassPerSecond())):this.factoryGrassRaw()>this.sodPerSecondRaw()?this.factorySodPerSecond(SmartRound(this.carryMineDirtPerSecond())):this.factorySodPerSecond(SmartRound(Math.min(this.carryMineDirtPerSecond(),this.carryFarmGrassPerSecond())));
		this.factoryDirtPerSecond(SmartRound(this.carryMineDirtPerSecond()-this.factorySodPerSecond()));
		this.factoryGrassPerSecond(SmartRound(this.carryFarmGrassPerSecond()-this.factorySodPerSecond()));
		this.sodPerSecondForBreeding(SmartRound(this.factorySodPerSecond()*(this.sodDedicatedToBreeding()/100)));
		this.AnimateWorkers()
	}
	,n.prototype.BreedCheck=function(n)
		{
		if(n||this.father().currentHealth()>=this.father().health&&this.mother().currentHealth()>=this.mother().health?(this.Breed(this.mother(),this.father(),"Royal"),!n&&this.boosts()<this.maxBoosts()&&this.boosts(Math.round((this.boosts()+.1)*10)/10)):this.pauseBreeding()||(this.mother().currentHealth(this.mother().currentHealth()+this.mother().health/this.mother().actionTime),this.father().currentHealth(this.father().currentHealth()+this.father().health/this.father().actionTime)),this.prince().currentHealth()>=this.prince().health&&this.princess().currentHealth()>=this.princess().health)this.Breed(this.princess(),this.prince(),"Heir");
		else if(this.sodDedicatedToBreeding()>0)
			{
			var r=this.sodRaw()/ticksPerSecond>this.sodPerSecondForBreeding()/ticksPerSecond?this.sodPerSecondForBreeding()/ticksPerSecond:this.sodRaw()/ticksPerSecond,t=this.princess().score*5,i=this.prince().score*5;
			this.prince().currentHealth()<this.prince().health&&this.princess().currentHealth()<this.princess().health?(t=t/r*2,i=i/r*2,this.princess().currentHealth(this.princess().currentHealth()+this.princess().health/t),this.prince().currentHealth(this.prince().currentHealth()+this.prince().health/i)):this.prince().currentHealth()<this.prince().health?(i=i/r,this.prince().currentHealth(this.prince().currentHealth()+this.prince().health/i)):(t=t/r,this.princess().currentHealth(this.princess().currentHealth()+this.princess().health/t));
			this.prince().currentHealth()<0&&this.prince().currentHealth(0);
			this.princess().currentHealth()<0&&this.princess().currentHealth(0);
			this.sodRaw(this.sodRaw()-r)
		}
	}
	,n.prototype.Breed=function(n,t,i)
		{
		var c,y,u,l,f,h,a,v,s,p,e,o,r;
		for(n.currentHealth(0),t.currentHealth(0),c=n.generation>t.generation?n.generation+1:t.generation+1,c>this.generations()&&this.generations(c),this.achievementCounts[7].Update(this.generations()),y=CoinFlip()?0:1,u=this.DefaultCritter(y,1,c),r=0;
		r<n.traits.length;
		r++)
			{
			for(u.traits[r].base=n.traits[r].base>=this.traitMax&&t.traits[r].base>=this.traitMax?this.traitMax:this.MutateStat(n.traits[r].base,t.traits[r].base,1,this.traitMax),l=0;
			l<n.traits[r].genes.length;
			l++)f=n.traits[r].genes[l],h=jQuery.grep(t.traits[r].genes,function(n)
				{
				return n.id==f.id
			}
			),h.length==1?(e=this.CalculateExpression(h[0].expression,f.expression),e!=0&&(a=0,f.value>=this.geneMax&&h[0].value>=this.geneMax?a=this.geneMax:e==2&&(a=this.MutateStat(f.value,h[0].value,f.good?1:0,this.geneMax)),o=new Gene(f.id,f.trait,e,f.name,a,f.good),o.value==0&&(o.expression=1),u.traits[r].genes.push(o))):(e=this.CalculateExpression(0,f.expression),e!=0&&(o=new Gene(f.id,f.trait,1,f.name,0,f.good),u.traits[r].genes.push(o)));
			for(v=0;
			v<t.traits[r].genes.length;
			v++)s=t.traits[r].genes[v],p=jQuery.grep(n.traits[r].genes,function(n)
				{
				return n.id==s.id
			}
			),p.length==0&&(e=this.CalculateExpression(0,s.expression),e!=0&&(o=new Gene(s.id,s.trait,e,s.name,0,s.good),u.traits[r].genes.push(o)));
			u.traits[r].genes.sort(function(n,t)
				{
				return t.value-n.value
			}
			)
		}
		for(u.CalculateScore(),this.NewGene(u),r=0;
		r<u.traits.length;
		r++)this.achievementCounts[r].Update(u.traits[r].value);
		this.achievementCounts[5].Update(u.score);
		this.achievementCounts[13].Update(u.totalMutations);
		i=="Royal"?u.gender==1?this.maleMound.unshift(u):this.femaleMound.unshift(u):(i="Heirs")&&(u.job=5,u.gender==1?this.princeMound.unshift(u):this.princessMound.unshift(u));
		this.newestBorn(u.id);
		this.Sort()
	}
	,n.prototype.NewGene=function(n)
		{
		var e=RandomInRange(1,this.newGeneChanceRange),r,i,t,f,u;
		if(e<=this.newGeneChance())for(this.missNewGene(0),r=!1,i=0;
		i<availableGenes.length;
		i++)
			{
			if(r)break;
			if(t=availableGenes[i],f=jQuery.grep(n.traits[t.trait].genes,function(n)
				{
				return n.id==t.id
			}
			),f.length==0)
				{
				var o=n.traits[t.trait].base,s=n.traits[t.trait].bonus,h=n.traits[t.trait].genes.length+1;
				o>25&&MutationCheck(h,s)&&(u=new Gene(t.id,t.trait,1,t.name,t.value,t.good),u.mutation=!0,n.traits[t.trait].genes.push(u),n.traits[t.trait].mutation=!0,n.CalculateScore(),r=!0)
			}
		}
		else this.missNewGene(this.missNewGene()+1)
	}
	,n.prototype.TogglePauseBreeding=function()
		{
		this.pauseBreeding(!this.pauseBreeding())
	}
	,n.prototype.TogglePauseExplore=function()
		{
		this.pauseExplore(!this.pauseExplore())
	}
	,n.prototype.TogglePauseAutoBattle=function()
		{
		this.pauseAutoBattle(!this.pauseAutoBattle())
	}
	,n.prototype.Select=function(n)
		{
		if(n.isLocked())
			{
			$(".tabcontents").notify("Shift click to unlock that critter","Info");
			return
		}
		n.job!=1&&n.job!=5&&n.job!=2&&(n.job!=3||this.inBattle())||n.isSelected(!n.isSelected())
	}
	,n.prototype.Lock=function(n)
		{
		n.job==1&&(n.isSelected(!1),n.isLocked(!n.isLocked()))
	}
	,n.prototype.Move=function(n,t,i,r)
		{
		var f,o,l,a,p,e,u;
		switch(t)
			{
			case"Male":f=this.maleMound;
			break;
			case"Female":f=this.femaleMound;
			break;
			case"Prince":f=this.princeMound;
			break;
			case"Princess":f=this.princessMound;
			break;
			case"Mine":f=this.mineMound;
			break;
			case"Farm":f=this.farmMound;
			break;
			case"Carrier":f=this.carrierMound;
			break;
			case"Factory":f=this.factoryMound;
			break;
			case"Army":f=this.armyMound
		}
		if(o=r.shiftKey||r.ctrlKey?f.removeAll():f.remove(function(n)
			{
			return n.isSelected()
		}
		),o.length==0&&(o=[f.shift()]),o[0]==undefined)
			{
			$(".tabcontents").notify("The mound is empty","Info");
			return
		}
		switch(n)
			{
			case"Mate":case"MateYoung":for(e=0;
			e<o.length;
			e++)
				{
				if(e>0)
					{
					o[e].isSelected(!1);
					f.unshift(o[e]);
					continue
				}
				if(u=o[e],u.isLocked())
					{
					f.unshift(u);
					$(".tabcontents").notify("Shift click to unlock that critter","Info");
					continue
				}
				u.job=0;
				u.isSelected(!1);
				u.gender==0&&n=="Mate"?(this.mother(u),this.mother().currentHealth(0)):u.gender==1&&n=="Mate"?(this.father(u),this.father().currentHealth(0)):u.gender==0&&n=="MateYoung"?(l=this.princess().currentHealth()/this.princess().health*this.princess().score,this.princess(u),this.princess().currentHealth(l/this.princess().score*5*this.princess().health)):u.gender==1&&n=="MateYoung"&&(a=this.prince().currentHealth()/this.prince().health*this.prince().score,this.prince(u),this.prince().currentHealth(a/this.prince().score*5*this.prince().health));
				this.Sort()
			}
			break;
			case"Worker":for(e=0;
			e<o.length;
			e++)
				{
				if(u=o[e],u.isLocked())
					{
					f.unshift(u);
					$(".tabcontents").notify("Shift click to unlock that critter","Info");
					continue
				}
				u.job=2;
				u.isSelected(!1);
				f.remove(u);
				var h=u.dirtPerSecond>this.lowestMiner()||this.mineMound().length<this.maxMineMoundSize(),c=u.grassPerSecond>this.lowestFarmer()||this.farmMound().length<this.maxFarmMoundSize(),v=u.carryPerSecond>this.lowestCarrier()||this.carrierMound().length<this.maxCarrierMoundSize(),y=u.sodPerSecond>this.lowestFactory()||this.factoryMound().length<this.maxFactoryMoundSize(),s=Math.min(this.dirtPerSecondRaw(),this.grassPerSecondRaw(),this.carryPerSecondRaw(),this.sodPerSecondRaw());
				h&&s==this.dirtPerSecondRaw()?this.mineMound.unshift(u):c&&s==this.grassPerSecondRaw()?this.farmMound.unshift(u):v&&s==this.carryPerSecondRaw()?this.carrierMound.unshift(u):y&&s==this.sodPerSecondRaw()?this.factoryMound.unshift(u):h&&c?(p=Math.min(this.dirtPerSecondRaw(),this.grassPerSecondRaw()),p==this.dirtPerSecondRaw()?this.mineMound.unshift(u):this.farmMound.unshift(u)):h?this.mineMound.unshift(u):c?this.farmMound.unshift(u):v?this.carrierMound.unshift(u):y&&this.factoryMound.unshift(u);
				this.Sort();
				this.UpdateProduction()
			}
			break;
			case"Army":for(e=0;
			e<o.length;
			e++)
				{
				if(u=o[e],u.isLocked())
					{
					f.unshift(u);
					$(".tabcontents").notify("Shift click to unlock that critter","Info");
					continue
				}
				u.isSelected(!1);
				u.job=3;
				f.remove(u);
				this.armyMound.unshift(u)
			}
			this.Sort();
			this.UpdateArmyUpgrades();
			break;
			case"Recycle":for(e=0;
			e<o.length;
			e++)
				{
				if(u=o[e],u.isLocked())
					{
					f.unshift(u);
					$(".tabcontents").notify("Shift click to unlock that critter","Info");
					continue
				}
				f.remove(u)
			}
			this.UpdateProduction();
			this.UpdateArmyUpgrades()
		}
		this.newestBorn(0)
	}
	,n.prototype.Boost=function()
		{
		this.boosts()<1||(this.boosts(Math.round((this.boosts()-1)*10)/10),this.BreedCheck(!0))
	}
	,n.prototype.Buy=function(n,t)
		{
		return this.sodRaw()>=n?(this.sodRaw(this.sodRaw()-n),!0):($(".tabcontents").notify("Not enough sod to build upgrade to the "+t+" Mound","Info"),!1)
	}
	,n.prototype.Upgrade=function(n)
		{
		switch(n)
			{
			case"FemaleHatchery":if(this.maxFemaleMoundSize()>=10)return;
			this.Buy(this.femaleMoundUpgradeCost(),"Female Hatchery Upgrade")&&this.maxFemaleMoundSize(this.maxFemaleMoundSize()+1);
			break;
			case"MaleHatchery":if(this.maxMaleMoundSize()>=10)return;
			this.Buy(this.maleMoundUpgradeCost(),"Male Hatchery Upgrade")&&this.maxMaleMoundSize(this.maxMaleMoundSize()+1);
			break;
			case"PrinceHatchery":if(this.maxPrinceMoundSize()>=10)return;
			this.Buy(this.princeMoundUpgradeCost(),"Prince Hatchery Upgrade")&&this.maxPrinceMoundSize(this.maxPrinceMoundSize()+1);
			break;
			case"PrincessHatchery":if(this.maxPrincessMoundSize()>=10)return;
			this.Buy(this.princessMoundUpgradeCost(),"Princess Hatchery Upgrade")&&this.maxPrincessMoundSize(this.maxPrincessMoundSize()+1);
			break;
			case"Mine":if(this.maxMineMoundSize()>=10)return;
			this.Buy(this.mineMoundUpgradeCost(),"Mine Upgrade")&&this.maxMineMoundSize(this.maxMineMoundSize()+1);
			break;
			case"Farm":if(this.maxFarmMoundSize()>=10)return;
			this.Buy(this.farmMoundUpgradeCost(),"Farm Upgrade")&&this.maxFarmMoundSize(this.maxFarmMoundSize()+1);
			break;
			case"Carrier":if(this.maxCarrierMoundSize()>=10)return;
			this.Buy(this.carrierMoundUpgradeCost(),"Carrier Upgrade")&&this.maxCarrierMoundSize(this.maxCarrierMoundSize()+1);
			break;
			case"Factory":if(this.maxFactoryMoundSize()>=10)return;
			this.Buy(this.factoryMoundUpgradeCost(),"Factory Upgrade")&&this.maxFactoryMoundSize(this.maxFactoryMoundSize()+1);
			break;
			case"Army":if(this.maxArmyMoundSize()>=10)return;
			this.Buy(this.armyMoundUpgradeCost(),"Barracks Upgrade")&&this.maxArmyMoundSize(this.maxArmyMoundSize()+1)
		}
	}
	,n.prototype.StartWar=function(n)
		{
		this.map(new GameMap);
		this.nation(n);
		this.map().nation=n;
		this.map().Generate(20,20);
		this.atWar(!0);
		this.exploreClock(0);
		this.armyUpgrades(new ArmyUpgrades);
		this.UpdateArmyUpgrades();
		this.Save()
	}
	,n.prototype.EndWar=function()
		{
		var t=this.nation().mapComplete()?this.nation().mapComplete():confirm("Are you sure you want to end this war?  You haven't finished this map yet and you'll have to start over."),n;
		if(t)
			{
			if(this.atWar(!1),this.nation().isDefeated())for(n=0;
			n<this.nations().length;
			n++)this.nations()[n].requiredToUnlock==this.nation().enemy&&this.nations()[n].isUnlocked(!0);
			this.map().tiles([]);
			this.armyUpgrades(new ArmyUpgrades);
			this.Save()
		}
	}
	,n.prototype.MapSelect=function(n)
		{
		n.isUnlocked()&&!n.isCleared()&&(this.map().currentBattle=n.coords,this.StartBattle())
	}
	,n.prototype.StartBattle=function()
		{
		var n,t;
		if(this.armyMound().length==0)
			{
			$(".tabcontents").notify("You should assign some soldiers to the barracks before starting a fight","error");
			return
		}
		for(this.showTreasure(!1),this.inBattle(!0),this.map().CreateArmy(),n=0;
		n<this.armyMound().length;
		n++)t=new BattleMoundIndex(this.armyMound()[n].id,!0,n,this.armyMound()[n].actionTime),this.battleOrder.push(t);
		for(n=0;
		n<this.map().enemyArmyMound().length;
		n++)t=new BattleMoundIndex(this.map().enemyArmyMound()[n].id,!1,n,this.map().enemyArmyMound()[n].actionTime),this.battleOrder.push(t);
		this.battleOrder.sort(function(n,t)
			{
			return n.speed==t.speed?0:n.speed>t.speed?1:-1
		}
		)
	}
	,n.prototype.Battle=function()
		{
		var f,e,h,r,o,p,c,i,t,u,b,s,w,n;
		if(this.inBattle())if(this.battleTurnClock<=0)
			{
			if(this.battleAttackerMoundIndex=this.battleOrder()[this.battleOrderIndex()],this.battleOrderIndex(this.battleOrderIndex()<this.battleOrder().length-1?this.battleOrderIndex()+1:0),this.battleAttackerMoundIndex==undefined)return;
			if(this.battleAttackerMoundIndex.isPlayer?(this.battleDefenderMound=this.map().enemyArmyMound,this.battleAttacker=this.armyMound()[this.battleAttackerMoundIndex.index]):(this.battleDefenderMound=this.armyMound,this.battleAttacker=this.map().enemyArmyMound()[this.battleAttackerMoundIndex.index]),this.battleAttacker.currentHealth()<=0)return;
			if(this.battleAttackerId(this.battleAttacker.id),f=jQuery.grep(this.battleDefenderMound(),function(n)
				{
				return n.currentHealth()>0
			}
			),f.length>0)
				{
				if(this.battleDefender=f[RandomInRange(0,f.length-1)],this.battleDefenderId(this.battleDefender.id),r=0,o=1,this.battleAttackerMoundIndex.isPlayer&&RandomInRange(1,100)<=this.battleAttacker.level()&&(o=2),CoinFlip())
					{
					var l=this.battleAttackerMoundIndex.isPlayer?this.battleAttacker.traits[3].value*(1+this.armyUpgrades().biteBonus()/100):this.battleAttacker.traits[3].value,a=this.battleAttackerMoundIndex.isPlayer?this.battleDefender.traits[4].value:this.battleDefender.traits[4].value*(1+this.armyUpgrades().stingBonus()/100),v=this.battleAttackerMoundIndex.isPlayer?this.battleAttacker.strengthBonus*(1+this.armyUpgrades().strengthBonus()/100):this.battleAttacker.strengthBonus,y=this.battleAttackerMoundIndex.isPlayer?this.battleDefender.agilityBonus:this.battleDefender.agilityBonus*(1+this.armyUpgrades().agilityBonus()/100);
					e=(l+v)*o;
					h=a+y;
					this.battleAttackerTrait(3);
					this.battleDefenderTrait(4)
				}
				else
					{
					var l=this.battleAttackerMoundIndex.isPlayer?this.battleDefender.traits[3].value:this.battleDefender.traits[3].value*(1+this.armyUpgrades().biteBonus()/100),a=this.battleAttackerMoundIndex.isPlayer?this.battleAttacker.traits[4].value*(1+this.armyUpgrades().stingBonus()/100):this.battleAttacker.traits[4].value,v=this.battleAttackerMoundIndex.isPlayer?this.battleDefender.strengthBonus:this.battleDefender.strengthBonus*(1+this.armyUpgrades().strengthBonus()/100),y=this.battleAttackerMoundIndex.isPlayer?this.battleAttacker.agilityBonus*(1+this.armyUpgrades().agilityBonus()/100):this.battleAttacker.agilityBonus;
					h=l+v;
					e=(a+y)*o;
					this.battleAttackerTrait(4);
					this.battleDefenderTrait(3)
				}
				r=e*e/h;
				p=RandomInRange(r-r/10,r+r/10);
				this.battleDamage(p);
				this.battleDamage()<=this.battleDefender.health/20&&this.battleDamage(this.battleDefender.health/20);
				this.battleDamage()>=this.battleDefender.currentHealth()&&(this.battleAttacker.experience(this.battleAttacker.experience()+this.battleDefender.experience()),this.battleDamage(this.battleDefender.currentHealth()));
				this.battleTurnClock=this.battleTurnLength()
			}
			else
				{
				if(this.battleAttackerMoundIndex.isPlayer)
					{
					if(this.map().battleReport.won(!0),c=this.map().Clear(),this.map().tilesCleared()==this.map().tileCount()&&(this.nation().mapComplete(!0),this.achievementCounts[21].Update(this.achievementCounts[21].value+1)),c!=null)
						{
						switch(c)
							{
							case 0:this.nation().isDefeated(!0);
							this.treasureTitle("YOU HAVE DESTROYED THE ENEMY");
							this.treasureText("YOU HAVE WON THE WAR.  IS THERE MORE?");
							break;
							case 1:this.nation().mineFound()==!1&&(this.bonusMinePercent(this.bonusMinePercent()+2),this.nation().mineFound(!0),this.treasureTitle("CAPTURED AN ENEMY MINE"),this.treasureText("YOUR CRITTERS CAN NOW MINE 2% FASTER"),this.achievementCounts[10].Update(this.achievementCounts[10].value+1));
							break;
							case 2:this.nation().farmFound()==!1&&(this.bonusFarmPercent(this.bonusFarmPercent()+2),this.nation().farmFound(!0),this.treasureTitle("CAPTURED AN ENEMY FARM"),this.treasureText("YOUR CRITTERS CAN NOW FARM 2% FASTER"),this.achievementCounts[18].Update(this.achievementCounts[18].value+1));
							break;
							case 3:this.nation().carryFound()==!1&&(this.bonusCarrierPercent(this.bonusCarrierPercent()+2),this.nation().carryFound(!0),this.treasureTitle("CAPTURED ENEMY EQUIPMENT"),this.treasureText("YOUR CRITTERS CAN CARRY 2% MORE"),this.achievementCounts[19].Update(this.achievementCounts[19].value+1));
							break;
							case 4:this.nation().factoryFound()==!1&&(this.bonusFactoryPercent(this.bonusFactoryPercent()+2),this.nation().factoryFound(!0),this.treasureTitle("CAPTURED AN ENEMY FACTORY"),this.treasureText("YOUR CRITTERS CAN NOW PRODUCE SOD 2% FASTER"),this.achievementCounts[20].Update(this.achievementCounts[20].value+1));
							break;
							case 8:this.nation().exploreFound()==!1&&(this.nation().exploreFound(!0),this.treasureTitle("FOUND HIGH GROUND"),this.treasureText("YOUR EXPLORATION SPEED INCREASED 50% ON THIS MAP"),this.achievementCounts[12].Update(this.achievementCounts[12].value+1));
							break;
							case 9:this.nation().fortFound()==!1&&(this.nation().fortFound(!0),this.treasureTitle("FOUND AN ABANDONED FORT"),this.treasureText("YOUR TRACKING SPEED INCREASED 50% ON THIS MAP"),this.achievementCounts[22].Update(this.achievementCounts[22].value+1));
							break;
							case 7:this.nation().boostFound()==!1&&(this.maxBoosts(this.maxBoosts()+5),this.boosts(this.maxBoosts()),this.nation().boostFound(!0),this.treasureTitle("LOVE CONQUERS ALL"),this.treasureText("YOUR MAXIMUM BOOSTS HAVE INCREASED BY 5."),this.achievementCounts[14].Update(this.achievementCounts[14].value+1));
							break;
							case 6:for(i=enemyGenes[this.nation().enemy],t=0;
							t<i.length;
							t++)u=new Gene(i[t].id,i[t].trait,i[t].expression,i[t].name,i[t].value,i[t].good),u.mutation=!0,b=jQuery.grep(this.mother
