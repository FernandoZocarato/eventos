<?php
namespace Database\Seeders;
use App\Models\User;
use App\Models\Event;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
class DatabaseSeeder extends Seeder {
 public function run(): void {
  // Somente dados públicos fictícios; a senha de demonstração deve ser configurada explicitamente.
  $user=User::firstOrCreate(['email'=>'organizador@example.test'],['name'=>'Equipe Conecta','password'=>Hash::make(bin2hex(random_bytes(24)))]);
  $items=[
   ['Criatividade em Movimento','Criatividade','São Paulo','Centro de Inovação • Vila Madalena','violet','Um encontro para quem constrói o próximo capítulo da tecnologia. Palestras, conversas e conexões sobre desenvolvimento web, arquitetura e produtos digitais.'],
   ['Design para pessoas','Design','Curitiba','Espaço Forma • Centro','lime','Uma imersão prática sobre interfaces, acessibilidade e experiências que colocam pessoas no centro. Traga suas ideias e conheça outros profissionais.'],
   ['Manhã de Ideias','Negócios','Belo Horizonte','Hub Horizonte • Savassi','orange','Fundadores e profissionais se encontram para compartilhar aprendizados sobre negócios digitais. Uma tarde de histórias reais, oficinas e networking.'],
   ['Jazz no Jardim','Cultura','Rio de Janeiro','Casa Aberta • Botafogo','blue','Uma celebração da criatividade independente com conversas, exposições e experiências colaborativas. Um convite para descobrir novas perspectivas.'],
   ['Clube do Livro: Nossas raízes','Cultura','São Paulo','Café Coletivo • Pinheiros','lime','Um encontro descontraído para trocar experiências sobre carreira e programação. Não importa seu nível: venha aprender, compartilhar e conhecer pessoas.'],
   ['Corrida & Café','Bem-estar','Porto Alegre','Laboratório Sul • Centro','violet','Workshop de aplicações com Vue e TypeScript, do primeiro componente à organização de um projeto. Leve seu notebook e desenvolva junto com a comunidade.']
  ];
  foreach($items as $i=>$item) {
   [$title,$category,$city,$location,$color,$description]=$item;
   Event::firstOrCreate(['title'=>$title,'user_id'=>$user->id],['category'=>$category,'city'=>$city,'location'=>$location,'color'=>$color,'description'=>$description,'starts_at'=>now()->addDays(7+$i*4)->setTime(14,0),'ends_at'=>now()->addDays(7+$i*4)->setTime(18,0),'capacity'=>80+$i*20,'status'=>'published']);
  }
 }
}
