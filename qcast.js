var QCast = {};
(function($){
  'use strict';
  
  //helper functions
  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  function serialize(ob){
    return JSON.stringify(ob);
  }
  
  function unserialize(str){
    var ob;
    try{
      ob = JSON.parse(str);
    }catch(e){
      ob = null;
    }
    return ob;
  }
  
  function objectLoad(k){
    var v = window.localStorage.getItem(k);
    if(!v){
      objectSave(k, {});
      return {};
    }
    return unserialize(v);
  }
  
  function objectSave(k, v){
    window.localStorage.setItem(k, serialize(v));
  }
  
  function isset(v){
    return typeof v != 'undefined';
  }
  
  
  //classes
  class QItem{
    constructor(id, url){
      this.id = id;
      this.url = url;
    }
    
    getId(){
      return this.id;
    }
    
    getUrl(){
      return this.url;
    }
  }
  
  class Queue{
    constructor(name){
      this.name = name;
      this.load(name);
    }
    
    addItem(url, loc){
      let id = '';
      while(!id || typeof this.items[id] != 'undefined')
        id = uuidv4();
      
      let item = new QItem(id, url);
      
      this.items[id] = item;
      this.order.push(id);
      
      if(isset(loc)){
        this.moveItem(id, loc);
      }
      
      this.save();
      
      return item;
    }
    
    removeItem(itemId){
      let currLoc = this.getItemIndex(itemId);
      
      this.order.splice(currLoc, 1);
      delete this.items[itemId];
      
      this.save();
    }
    
    moveItem(itemId, newLoc){
      let currLoc = this.getItemIndex(itemId);
      if(newLoc == 'next'){
        newLoc = this.getNextItemIndex(itemId);
      }
      
      this.order[currLoc] = '';
      this.order.splice(newLoc, 0, itemId);
      this.order.filter((val) => val !== '');
      
      this.save();
    }
    
    getItemIndex(itemId){
      let currId = this.getLastPlayedId();
      return this.order.indexOf(currId);
    }
    
    getNextItemIndex(itemId){
      let currLoc = this.getItemIndex(itemId);
      if(currLoc != -1){
        return (currLoc + 1) % this.order.length;
      }else{
        return 0;
      }
    }
    
    getNextItem(itemId){
      return this.items[this.order[this.getNextItemIndex(itemId)]];
    }
    
    getLastPlayedId(){
      return this.getInfo('lastPlayed');
    }
    
    getInfo(k){
      return isset(k) ? (isset(this.info[k]) ? this.info[k] : null) : this.info;
    }
    
    setInfo(k, v){
      if(typeof k == 'object'){
        this.info = k;
        this.save();
      }else if(typeof k == 'string'){
        this.info[k] = v;
        this.save();
      }
      return this;
    }
    
    save(){
      objectSave('qcast/queue/'+this.name, this);
      return this;
    }
    
    load(name){
      this.name = isset(name) ? name : this.name;
      if(this.name){
        let ob = objectLoad('qcast/queue/'+this.name);
        this.items = {};
        if(isset(this.items)){
          $.each(ob.items, (id,item) => {
            this.items[id] = new QItem(id,item.url);
          });
        }
        this.info = isset(ob.info) ? ob.info : {};
        this.order = isset(ob.order) ? ob.order : [];
      }
      return this;
    }
  }
  
  function insertListEl($list, itemTmpl, qitem){
    var $itemEl = $(itemTmpl).attr('id', qitem.getId());
    $itemEl.find('.url').text(qitem.getUrl());
    $list.append($itemEl);
    return $itemEl;
  }
  
  function playItem(queue, id){
    var url = queue.items[id].getUrl();
    var $input = $('[name="video_link"]');
    
    if($input.length){
      queue.setInfo('lastPlayed', id);
      
      $input.val(url);
      $('[name="submit"]').click();
    }
  }
  
  function playNextItem(queue){
    let nextItem = queue.getNextItem();
    playItem(queue, nextItem.getId());
  }
  
  QCast.hasRunInit = false;
  $(window).on('load qcast/init', function(){
    if(QCast.hasRunInit) return;
    
    var domain = 'http://q.cast';
    
    var templates = {
      wrapper : {src:domain+'/wrapper.html', html:''},
      add : {src:domain+'/add-item.html', html:''},
      list : {src:domain+'/queue-list.html', html:''},
      item : {src:domain+'/queue-item.html', html:''}
    };
    
    var templateLoadCount = templates.length;
    
    $('head').append('<link href="'+domain+'/qcast.css" rel="stylesheet">');
    
    $(document).on('qcast/templates-loaded', function(){
      //load initial templates
      $('body').append(templates.wrapper.html);
      $('[data-qcast] .add').append(templates.add.html);
      $('[data-qcast] .queue').append(templates.list.html);
      
      var $qcast = $('[data-qcast]');
      var $list = $('[data-qcast] .queue [data-role="list"]');
      
      //load initial list
      var queue = new Queue('default');
      
      $.each(queue.order, (i, id) => {
        let qitem = queue.items[id];
        let $itemEl = insertListEl($list, templates.item.html, qitem);
        if(id == queue.getLastPlayedId()){
          $itemEl.addClass('lastPlayed');
        }
      });
      
      //EVENTS
      
      //add new
      $qcast.on('click', '[data-action="add"]', function(){
        let url = $(this).siblings('[data-input="new"]').val();
        let qitem = queue.addItem(url);
        insertListEl($list, templates.item.html, qitem);
      });
      
      //remove item
      $qcast.on('click', '[data-action="remove"]', function(){
        let $item = $(this).closest('[data-role="item"]');
        let id = $item.attr('id');
        $item.remove();
        queue.removeItem(id);
      });
      
      //play item
      $qcast.on('click', '[data-action="play"]', function(){
        let $item = $(this).closest('[data-role="item"]');
        let id = $item.attr('id');
        playItem(queue, id);
      });
      
      //autoplay
      window.setInterval((q) => {
        if($('#progress').width() < 600){
          return;
        }
        playNextItem(q);
      }, 5000, queue);
      
    });
    
    $.each(templates, function(k,v){
      $.ajax(v.src, {
        dataType: 'html',
        //crossDomain = true,
        success: function(data){
          templates[k]['html'] = data;
          
          var stillTemplatesToLoad = false;
          $.each(templates, function(k,v){
            if(! v.html){
              stillTemplatesToLoad = true;
            }
          });
          
          if(! stillTemplatesToLoad)
            $(document).trigger('qcast/templates-loaded');
        }
      });
    });
    
    QCast.hasRunInit = true;
  });
})(jQuery);
