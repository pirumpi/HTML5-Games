var clamp = function(x, min, max){
    return x < min ? min : (x > max ? max :x );
};
var SPRITE_SHOT = 77;

var levels = ['level2', 'level3'];

var Q = new Quintus()
    .include("Sprites, Anim, Input, Touch, Scenes, UI")
    .setup({width: 800, height: 680, scaleToFit: true})
    .touch();

Q.input.touchControls({
    controls: [
      ['left', '<'],
      ['right', '>'],
        [],
        [],
        [],
        ['fire','a']
    ]
});

Q.controls();

Q.Sprite.extend("Player", {
   init: function(p){
       this._super(p,{
          sheet: 'player',
           x: Q.el.width /2,
           y: Q.el.height - 90,
           sprite: 'player',
           speed: 10,
           type: Q.SPRITE_FRIENDLY,
           collisionMask: SPRITE_SHOT
       });

      this.add('animation');
      this.play('default');
      this.add('Gun');
      this.on('hit', function(col){
        if(col.obj.isA('Shot') && ((col.obj.p.type & Q.SPRITE_ENEMY) == Q.SPRITE_ENEMY)){
          this.destroy();
          col.obj.destroy();
          Q.stageScene('endGame',1,{label: 'You Died!'});
        }
      });
   },
    step: function(dt){
        if(Q.inputs['left']){
            this.p.x -= this.p.speed;
        }
        if(Q.inputs['right']){
            this.p.x += this.p.speed;
        }

        this.stage.collide(this);

        this.p.x = clamp(this.p.x, 0 + (this.p.w /2), Q.el.width - (this.p.w /2));
    }
});

Q.Sprite.extend('Alien', {
    init: function(p){
        this._super(p,{
            sprite: 'alien',
            sheet: 'alien',
            x: Q.el.width / 2,
            speed: 120,
            type: Q.SPRITE_ENEMY,
            collisionMask: SPRITE_SHOT
        });
        this.p.y = this.p.h;
        this.add('animation');
        this.play('default');
        this.add('BasicAI');
        this.add('Levels');
        this.on('hit', function(col){
            if(col.obj.isA('Shot') && ((col.obj.p.type & Q.SPRITE_FRIENDLY) == Q.SPRITE_FRIENDLY)){
                this.destroy();
                col.obj.destroy();
                this.nextLevel();

            }
        });
    },
    step: function(dt){
        this.stage.collide(this);
    }
});

Q.component('BasicAI',{
    added: function(){
        this.entity.changeDirections();
        this.entity.on('step', 'move');
        this.entity.on('step', 'tryToFire');
        this.entity.add('Gun');
    },
    extend: {
        changeDirections: function(){
            var entity = this;
            var numberOfSeconds = Math.floor((Math.random() * 5));
            setTimeout(function(){
                entity.p.speed = -entity.p.speed;
                entity.changeDirections();
            }, numberOfSeconds * 1000);
        },
        move: function(dt){
            this.p.x -= this.p.speed * dt;
            if( (this.p.x > Q.el.width - (this.p.w/2)) ||
               (this.p.x < 0 + (this.p.w /2)) ){
                this.p.speed = -this.p.speed;
            }
        },
        tryToFire: function(dt){
            var player = Q('Player').first();
            if(!player){return;}
            if(player.p.x + player.p.w > this.p.x && player.p.x - player.p.w < this.p.x){
                this.fire(Q.SPRITE_ENEMY);
            }

        }
    }
});

Q.Sprite.extend("Shot", {
    init: function(p){
        this._super(p, {
            sprite: 'shot',
            sheet: 'shot',
            speed: 200,
            type: SPRITE_SHOT
        });

        this.add('animation');
        this.play('default');

    },
    step: function(dt){
        this.p.y -= this.p.speed * dt;

        if(this.p.y > Q.el.height || this.p.y < 0){
            this.destroy();
        }
    }
});

Q.component('Levels', {
  extend:{
    aliveAliens: function(){
      var aliens = Q('Alien').items;
      if(!aliens.length) {return false;}
      for(var i = 0; i < aliens.length; i++){
        if(!aliens[i].isDestroyed){
          return true;
        }
      }
      return false;
    },
    nextLevel: function(){
      if(!this.aliveAliens() && !levels.length){
        Q.stageScene('endGame',1,{label: 'You won!'});
      }else if(!this.aliveAliens() && levels.length > 0){
        Q.clearStages();
        var nextLevel = levels.shift()
        Q.stageScene(nextLevel);
        console.log('Going to level ', nextLevel);
      }
    }
  }
});

Q.component('Gun', {
    added: function(){
        this.entity.p.shots = [];
        this.entity.p.canFire = true;
        this.entity.on('step', 'handleFiring');
    },

    extend:{
        handleFiring: function(dt){
            var entity = this;

            for(var i = entity.p.shots.length -1; i >= 0; i--){
                if(entity.p.shots[i].isDestroyed){
                    entity.p.shots.splice(i, 1);
                }
            }

            if(Q.inputs['fire'] && entity.p.type == Q.SPRITE_FRIENDLY){
                this.fire(Q.SPRITE_FRIENDLY  );
            }
        },
        fire: function(type){
            var entity = this;

            if(!entity.p.canFire) { return; }
            var shot;
            if(type == Q.SPRITE_FRIENDLY){
                shot = Q.stage().insert(new Q.Shot({x: this.p.x, y: this.p.y - 50, speed: 200, type: Q.SPRITE_DEFAULT | Q.SPRITE_FRIENDLY}));
            }else{
                shot = Q.stage().insert(new Q.Shot({x: this.p.x, y: this.p.y + entity.p.h-30, speed: -200, type: Q.SPRITE_DEFAULT | Q.SPRITE_ENEMY}));
            }

            this.p.shots.push(shot);
            entity.p.canFire = false;

            setTimeout(function(){
                entity.p.canFire = true;
            }, 500);
        }
    }
});

Q.scene('level1', function(stage){
    Q.gravity = 0;
    stage.insert(new Q.Sprite({asset: 'BackGround1.png', x: Q.el.width / 2, y: Q.el.height / 2, type: 0}));
    stage.insert(new Q.Player());
    stage.insert(new Q.Alien());

});

Q.scene('level2', function(stage){
  Q.gravity = 0;
  stage.insert(new Q.Sprite({asset: 'BackGround2.jpg', x: Q.el.width / 2, y: Q.el.height / 2, type: 0}));
  stage.insert(new Q.Player());
  stage.insert(new Q.Alien());
  stage.insert(new Q.Alien());
});

Q.scene('level3', function(stage){
  Q.gravity = 0;
  stage.insert(new Q.Sprite({asset: 'BackGround3.jpg', x: Q.el.width / 2, y: Q.el.height / 2, type: 0}));
  stage.insert(new Q.Player());
  stage.insert(new Q.Alien());
  stage.insert(new Q.Alien());
  stage.insert(new Q.Alien());
});

Q.scene('endGame', function(stage){
  var container = stage.insert(new Q.UI.Container({
      x:Q.width/2, y: Q.height /2, fill: '#fff'
  }));

  var button = container.insert(new Q.UI.Button({
    x: 0, y: 0, fill: '#ccc', label: 'Play Again'
  }));

  container.insert(new Q.UI.Text({
    x: 10, y: -10 - button.p.h, label: stage.options.label
  }));
  button.on('click', function(){
    Q.clearStages();
    Q.stageScene('level1');
    levels = ['level2', 'level3'];
  });
  container.fit(20);

});



Q.load(['BackGround1.png','BackGround2.jpg','BackGround3.jpg', 'fireship.png', 'player.json', 'shot.png', 'shot.json', 'alien.png', 'alien.json'], function(){
    Q.compileSheets('fireship.png', 'player.json');
    Q.compileSheets('shot.png', 'shot.json');
    Q.compileSheets('alien.png', 'alien.json');
    Q.animations('player', {default: {frames: [0, 1], rate: 1/8} });
    Q.animations('shot', {default: {frames: [0,1], rate: 1/4}});
    Q.animations('alien', {default:{ frames: [0,1,2], rate: 1/4 }});
    Q.stageScene('level1');
});
