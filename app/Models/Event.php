<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Event extends Model {
 protected $fillable=['title','category','description','location','city','starts_at','ends_at','capacity','status','color'];
 protected $casts=['starts_at'=>'datetime','ends_at'=>'datetime'];
 public function user(): BelongsTo {return $this->belongsTo(User::class);}
 public function registrations(): HasMany {return $this->hasMany(Registration::class);}
}
