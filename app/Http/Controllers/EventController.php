<?php
namespace App\Http\Controllers;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
class EventController extends Controller {
 public function index(Request $request) {
  $data=$request->validate(['q'=>'nullable|string|max:100','category'=>'nullable|string|max:40','city'=>'nullable|string|max:100','page'=>'nullable|integer|min:1']);
  return Event::with('user:id,name')->withCount('registrations')->where('status','published')->where('starts_at','>',now())
   ->when($data['q']??null,fn($q,$term)=>$q->where(fn($q)=>$q->where('title','like',"%{$term}%")->orWhere('description','like',"%{$term}%")))
   ->when($data['category']??null,fn($q,$v)=>$q->where('category',$v))
   ->when($data['city']??null,fn($q,$v)=>$q->where('city','like',"%{$v}%"))->orderBy('starts_at')->paginate(12);
 }
 public function show(Request $request,Event $event) {
  abort_unless($event->status==='published'||$event->user_id===$request->user()?->id,404);
  return $event->load('user:id,name')->loadCount('registrations');
 }
 public function mine(Request $request) {return Event::withCount(['registrations','registrations as checkins_count'=>fn($q)=>$q->whereNotNull('checked_in_at')])->where('user_id',$request->user()->id)->orderByDesc('created_at')->get();}
 public function store(Request $request) {
  $event=new Event($this->validated($request));$event->user_id=$request->user()->id;$event->save();
  return response()->json($event->loadCount('registrations'),201);
 }
 public function update(Request $request,Event $event) {
  $this->owner($request,$event);
  return DB::transaction(function() use($request,$event) {
   $locked=Event::whereKey($event->id)->lockForUpdate()->firstOrFail();$data=$this->validated($request);
   abort_if($data['capacity']<$locked->registrations()->count(),422,'A capacidade não pode ser menor que o número de inscritos.');
   $locked->update($data);return $locked->loadCount('registrations');
  });
 }
 public function attendees(Request $request,Event $event) {
  $this->owner($request,$event);return $event->registrations()->with('user:id,name,email')->orderBy('created_at')->get();
 }
 private function owner(Request $request,Event $event): void {abort_unless($event->user_id===$request->user()->id,403);}
 private function validated(Request $request): array {
  return $request->validate(['title'=>'required|string|max:160','description'=>'required|string|min:30|max:10000',
   'category'=>['required',Rule::in(['Tecnologia','Design','Negócios','Cultura','Comunidade','Criatividade','Bem-estar'])],
   'location'=>'required|string|max:255','city'=>'required|string|max:100','starts_at'=>'required|date|after:now',
   'ends_at'=>'required|date|after:starts_at','capacity'=>'required|integer|min:1|max:100000',
   'status'=>['required',Rule::in(['draft','published','cancelled'])],
   'color'=>['required',Rule::in(['violet','lime','orange','blue'])]]);
 }
}
