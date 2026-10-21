<?php
namespace App\Http\Controllers;
use App\Models\Event;
use App\Models\Registration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
class RegistrationController extends Controller {
 public function index(Request $request) {return Registration::with('event.user:id,name')->where('user_id',$request->user()->id)->latest()->get();}
 public function store(Request $request,Event $event) {
  return DB::transaction(function() use($request,$event) {
   $locked=Event::whereKey($event->id)->lockForUpdate()->firstOrFail();
   abort_unless($locked->status==='published'&&$locked->starts_at->isFuture(),422,'Este evento não está aberto para inscrições.');
   abort_if($locked->user_id===$request->user()->id,422,'Você já organiza este evento.');
   abort_if($locked->registrations()->where('user_id',$request->user()->id)->exists(),422,'Você já está inscrito neste evento.');
   abort_if($locked->registrations()->count()>=$locked->capacity,422,'As vagas deste evento esgotaram.');
   $registration=$locked->registrations()->create(['user_id'=>$request->user()->id,'code'=>(string)Str::uuid()]);
   return response()->json($registration->load('event'),201);
  });
 }
 public function destroy(Request $request,Registration $registration) {
  abort_unless($registration->user_id===$request->user()->id,403);
  return DB::transaction(function() use($registration) {
   $event=Event::whereKey($registration->event_id)->lockForUpdate()->firstOrFail();
   $locked=Registration::whereKey($registration->id)->lockForUpdate()->firstOrFail();
   abort_if($locked->checked_in_at||$event->starts_at->isPast(),422,'Não é possível cancelar após o início ou check-in.');
   $locked->delete();return response()->noContent();
  });
 }
 public function checkin(Request $request,Event $event) {
  abort_unless($event->user_id===$request->user()->id,403);
  $data=$request->validate(['code'=>'required|uuid']);
  return DB::transaction(function() use($event,$data) {
   $lockedEvent=Event::whereKey($event->id)->lockForUpdate()->firstOrFail();
   abort_unless($lockedEvent->status==='published',422,'O evento precisa estar publicado.');
   $ticket=$lockedEvent->registrations()->where('code',$data['code'])->lockForUpdate()->firstOrFail();
   abort_if($ticket->checked_in_at,422,'Este ingresso já foi utilizado.');
   $ticket->update(['checked_in_at'=>now()]);return $ticket->load('user:id,name,email');
  });
 }
}
